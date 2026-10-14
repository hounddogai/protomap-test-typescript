import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryInsightMapping } from "./primary-insight-mapping.js";

/** Keeps primary insight mappings by code. */
export interface PrimaryInsightMappingStore {
  find(code: string): PrimaryInsightMapping | undefined;
  save(item: PrimaryInsightMapping): void;
  remove(code: string): boolean;
  list(): PrimaryInsightMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryInsightMappingStore implements PrimaryInsightMappingStore {
  items: Map<string, PrimaryInsightMapping>;
  order: string[];

  constructor(items: Map<string, PrimaryInsightMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryInsightMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryInsightMapping): void {
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

  list(): PrimaryInsightMapping[] {
    const out: PrimaryInsightMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryInsightMappingStore(): PrimaryInsightMappingStore {
  return new MemoryPrimaryInsightMappingStore(new Map<string, PrimaryInsightMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryInsightMappingStore implements PrimaryInsightMappingStore {
  inner: PrimaryInsightMappingStore;
  cache: cache.TtlCache<PrimaryInsightMapping>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryInsightMappingStore,
    cacheValue: cache.TtlCache<PrimaryInsightMapping>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryInsightMapping | undefined {
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

  save(item: PrimaryInsightMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryInsightMapping[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryInsightMappingStore(inner: PrimaryInsightMappingStore, ttl: number, clockValue: clock.Clock): PrimaryInsightMappingStore {
  return new CachedPrimaryInsightMappingStore(
    inner,
    cache.newTtlCache<PrimaryInsightMapping>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary insight mappings. Empty fields match all. */
export class PrimaryInsightMappingQuery {
  utmSource: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minPriority: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryInsightMapping): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryInsightMapping[]): PrimaryInsightMapping[] {
    const matched = collections.filter(items, (candidate: PrimaryInsightMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryInsightMappings(store: PrimaryInsightMappingStore, query: PrimaryInsightMappingQuery): PrimaryInsightMapping[] {
  return query.apply(store.list());
}
