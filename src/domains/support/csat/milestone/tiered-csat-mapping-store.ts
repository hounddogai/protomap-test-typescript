import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredCsatMapping } from "./tiered-csat-mapping.js";

/** Keeps tiered csat mappings by code. */
export interface TieredCsatMappingStore {
  find(code: string): TieredCsatMapping | undefined;
  save(item: TieredCsatMapping): void;
  remove(code: string): boolean;
  list(): TieredCsatMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredCsatMappingStore implements TieredCsatMappingStore {
  items: Map<string, TieredCsatMapping>;
  order: string[];

  constructor(items: Map<string, TieredCsatMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredCsatMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredCsatMapping): void {
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

  list(): TieredCsatMapping[] {
    const out: TieredCsatMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredCsatMappingStore(): TieredCsatMappingStore {
  return new MemoryTieredCsatMappingStore(new Map<string, TieredCsatMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredCsatMappingStore implements TieredCsatMappingStore {
  inner: TieredCsatMappingStore;
  cache: cache.TtlCache<TieredCsatMapping>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredCsatMappingStore,
    cacheValue: cache.TtlCache<TieredCsatMapping>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredCsatMapping | undefined {
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

  save(item: TieredCsatMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredCsatMapping[] {
    return this.inner.list();
  }
}

export function newCachedTieredCsatMappingStore(inner: TieredCsatMappingStore, ttl: number, clockValue: clock.Clock): TieredCsatMappingStore {
  return new CachedTieredCsatMappingStore(inner, cache.newTtlCache<TieredCsatMapping>(1024, ttl, clockValue), 0, 0);
}

/** Selects tiered csat mappings. Empty fields match all. */
export class TieredCsatMappingQuery {
  title: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minRevision: number, statuses: string[], limit: number) {
    this.title = title;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredCsatMapping): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredCsatMapping[]): TieredCsatMapping[] {
    const matched = collections.filter(items, (candidate: TieredCsatMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredCsatMappings(store: TieredCsatMappingStore, query: TieredCsatMappingQuery): TieredCsatMapping[] {
  return query.apply(store.list());
}
