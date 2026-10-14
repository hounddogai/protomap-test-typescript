import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { InsightMapping } from "./insight-mapping.js";

/** Keeps insight mappings by code. */
export interface InsightMappingStore {
  find(code: string): InsightMapping | undefined;
  save(item: InsightMapping): void;
  remove(code: string): boolean;
  list(): InsightMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryInsightMappingStore implements InsightMappingStore {
  items: Map<string, InsightMapping>;
  order: string[];

  constructor(items: Map<string, InsightMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): InsightMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: InsightMapping): void {
    if (!this.items.has(item.code)) {
      this.order.push(item.code);
    }
    this.items.set(item.code, item);
  }

  remove(code: string): boolean {
    if (!this.items.has(code)) return false;
    this.items.delete(code);
    const kept: string[] = [];
    for (const existing of this.order) {
      if (existing !== code) {
        kept.push(existing);
      }
    }
    this.order = kept;
    return true;
  }

  list(): InsightMapping[] {
    const out: InsightMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryInsightMappingStore(): InsightMappingStore {
  return new MemoryInsightMappingStore(new Map<string, InsightMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedInsightMappingStore implements InsightMappingStore {
  inner: InsightMappingStore;
  cache: cache.TtlCache<InsightMapping>;
  hits: number;
  misses: number;

  constructor(
    inner: InsightMappingStore,
    cacheValue: cache.TtlCache<InsightMapping>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): InsightMapping | undefined {
    const hit = this.cache.get(code);
    if (hit === undefined) {
      this.misses += 1;
      const found = this.inner.find(code);
      if (found === undefined) return undefined;
      this.cache.put(code, found);
      return found;
    }
    this.hits += 1;
    return hit;
  }

  save(item: InsightMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): InsightMapping[] {
    return this.inner.list();
  }
}

export function newCachedInsightMappingStore(inner: InsightMappingStore, ttl: number, clockValue: clock.Clock): InsightMappingStore {
  return new CachedInsightMappingStore(inner, cache.newTtlCache<InsightMapping>(1024, ttl, clockValue), 0, 0);
}

/** Selects insight mappings. Empty fields match all. */
export class InsightMappingQuery {
  source: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minRevision: number, statuses: string[], limit: number) {
    this.source = source;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: InsightMapping): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: InsightMapping[]): InsightMapping[] {
    const matched = collections.filter(items, (candidate: InsightMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findInsightMappings(store: InsightMappingStore, query: InsightMappingQuery): InsightMapping[] {
  return query.apply(store.list());
}
