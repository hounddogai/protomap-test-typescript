import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedWarmupMapping } from "./weighted-warmup-mapping.js";

/** Keeps weighted warmup mappings by code. */
export interface WeightedWarmupMappingStore {
  find(code: string): WeightedWarmupMapping | undefined;
  save(item: WeightedWarmupMapping): void;
  remove(code: string): boolean;
  list(): WeightedWarmupMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedWarmupMappingStore implements WeightedWarmupMappingStore {
  items: Map<string, WeightedWarmupMapping>;
  order: string[];

  constructor(items: Map<string, WeightedWarmupMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedWarmupMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedWarmupMapping): void {
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

  list(): WeightedWarmupMapping[] {
    const out: WeightedWarmupMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedWarmupMappingStore(): WeightedWarmupMappingStore {
  return new MemoryWeightedWarmupMappingStore(new Map<string, WeightedWarmupMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedWarmupMappingStore implements WeightedWarmupMappingStore {
  inner: WeightedWarmupMappingStore;
  cache: cache.TtlCache<WeightedWarmupMapping>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedWarmupMappingStore,
    cacheValue: cache.TtlCache<WeightedWarmupMapping>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedWarmupMapping | undefined {
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

  save(item: WeightedWarmupMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedWarmupMapping[] {
    return this.inner.list();
  }
}

export function newCachedWeightedWarmupMappingStore(inner: WeightedWarmupMappingStore, ttl: number, clockValue: clock.Clock): WeightedWarmupMappingStore {
  return new CachedWeightedWarmupMappingStore(
    inner,
    cache.newTtlCache<WeightedWarmupMapping>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted warmup mappings. Empty fields match all. */
export class WeightedWarmupMappingQuery {
  name: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minConversionRate: number, statuses: string[], limit: number) {
    this.name = name;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedWarmupMapping): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedWarmupMapping[]): WeightedWarmupMapping[] {
    const matched = collections.filter(items, (candidate: WeightedWarmupMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedWarmupMappings(store: WeightedWarmupMappingStore, query: WeightedWarmupMappingQuery): WeightedWarmupMapping[] {
  return query.apply(store.list());
}
