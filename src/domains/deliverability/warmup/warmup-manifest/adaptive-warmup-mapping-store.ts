import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveWarmupMapping } from "./adaptive-warmup-mapping.js";

/** Keeps adaptive warmup mappings by code. */
export interface AdaptiveWarmupMappingStore {
  find(code: string): AdaptiveWarmupMapping | undefined;
  save(item: AdaptiveWarmupMapping): void;
  remove(code: string): boolean;
  list(): AdaptiveWarmupMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveWarmupMappingStore implements AdaptiveWarmupMappingStore {
  items: Map<string, AdaptiveWarmupMapping>;
  order: string[];

  constructor(items: Map<string, AdaptiveWarmupMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveWarmupMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveWarmupMapping): void {
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

  list(): AdaptiveWarmupMapping[] {
    const out: AdaptiveWarmupMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveWarmupMappingStore(): AdaptiveWarmupMappingStore {
  return new MemoryAdaptiveWarmupMappingStore(new Map<string, AdaptiveWarmupMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveWarmupMappingStore implements AdaptiveWarmupMappingStore {
  inner: AdaptiveWarmupMappingStore;
  cache: cache.TtlCache<AdaptiveWarmupMapping>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveWarmupMappingStore,
    cacheValue: cache.TtlCache<AdaptiveWarmupMapping>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveWarmupMapping | undefined {
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

  save(item: AdaptiveWarmupMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveWarmupMapping[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveWarmupMappingStore(inner: AdaptiveWarmupMappingStore, ttl: number, clockValue: clock.Clock): AdaptiveWarmupMappingStore {
  return new CachedAdaptiveWarmupMappingStore(
    inner,
    cache.newTtlCache<AdaptiveWarmupMapping>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive warmup mappings. Empty fields match all. */
export class AdaptiveWarmupMappingQuery {
  source: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minCeiling: number, statuses: string[], limit: number) {
    this.source = source;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveWarmupMapping): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveWarmupMapping[]): AdaptiveWarmupMapping[] {
    const matched = collections.filter(items, (candidate: AdaptiveWarmupMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveWarmupMappings(store: AdaptiveWarmupMappingStore, query: AdaptiveWarmupMappingQuery): AdaptiveWarmupMapping[] {
  return query.apply(store.list());
}
