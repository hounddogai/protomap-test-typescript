import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackConversionMapping } from "./fallback-conversion-mapping.js";

/** Keeps fallback conversion mappings by code. */
export interface FallbackConversionMappingStore {
  find(code: string): FallbackConversionMapping | undefined;
  save(item: FallbackConversionMapping): void;
  remove(code: string): boolean;
  list(): FallbackConversionMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackConversionMappingStore implements FallbackConversionMappingStore {
  items: Map<string, FallbackConversionMapping>;
  order: string[];

  constructor(items: Map<string, FallbackConversionMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackConversionMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackConversionMapping): void {
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

  list(): FallbackConversionMapping[] {
    const out: FallbackConversionMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackConversionMappingStore(): FallbackConversionMappingStore {
  return new MemoryFallbackConversionMappingStore(new Map<string, FallbackConversionMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackConversionMappingStore implements FallbackConversionMappingStore {
  inner: FallbackConversionMappingStore;
  cache: cache.TtlCache<FallbackConversionMapping>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackConversionMappingStore,
    cacheValue: cache.TtlCache<FallbackConversionMapping>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackConversionMapping | undefined {
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

  save(item: FallbackConversionMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackConversionMapping[] {
    return this.inner.list();
  }
}

export function newCachedFallbackConversionMappingStore(inner: FallbackConversionMappingStore, ttl: number, clockValue: clock.Clock): FallbackConversionMappingStore {
  return new CachedFallbackConversionMappingStore(
    inner,
    cache.newTtlCache<FallbackConversionMapping>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback conversion mappings. Empty fields match all. */
export class FallbackConversionMappingQuery {
  name: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minThreshold: number, statuses: string[], limit: number) {
    this.name = name;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackConversionMapping): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackConversionMapping[]): FallbackConversionMapping[] {
    const matched = collections.filter(items, (candidate: FallbackConversionMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackConversionMappings(store: FallbackConversionMappingStore, query: FallbackConversionMappingQuery): FallbackConversionMapping[] {
  return query.apply(store.list());
}
