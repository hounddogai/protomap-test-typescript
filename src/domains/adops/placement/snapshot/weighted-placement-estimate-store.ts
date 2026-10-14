import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedPlacementEstimate } from "./weighted-placement-estimate.js";

/** Keeps weighted placement estimates by code. */
export interface WeightedPlacementEstimateStore {
  find(code: string): WeightedPlacementEstimate | undefined;
  save(item: WeightedPlacementEstimate): void;
  remove(code: string): boolean;
  list(): WeightedPlacementEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedPlacementEstimateStore implements WeightedPlacementEstimateStore {
  items: Map<string, WeightedPlacementEstimate>;
  order: string[];

  constructor(items: Map<string, WeightedPlacementEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedPlacementEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedPlacementEstimate): void {
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

  list(): WeightedPlacementEstimate[] {
    const out: WeightedPlacementEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedPlacementEstimateStore(): WeightedPlacementEstimateStore {
  return new MemoryWeightedPlacementEstimateStore(new Map<string, WeightedPlacementEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedPlacementEstimateStore implements WeightedPlacementEstimateStore {
  inner: WeightedPlacementEstimateStore;
  cache: cache.TtlCache<WeightedPlacementEstimate>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedPlacementEstimateStore,
    cacheValue: cache.TtlCache<WeightedPlacementEstimate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedPlacementEstimate | undefined {
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

  save(item: WeightedPlacementEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedPlacementEstimate[] {
    return this.inner.list();
  }
}

export function newCachedWeightedPlacementEstimateStore(inner: WeightedPlacementEstimateStore, ttl: number, clockValue: clock.Clock): WeightedPlacementEstimateStore {
  return new CachedWeightedPlacementEstimateStore(
    inner,
    cache.newTtlCache<WeightedPlacementEstimate>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted placement estimates. Empty fields match all. */
export class WeightedPlacementEstimateQuery {
  locale: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minBatchSize: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedPlacementEstimate): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedPlacementEstimate[]): WeightedPlacementEstimate[] {
    const matched = collections.filter(items, (candidate: WeightedPlacementEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedPlacementEstimates(store: WeightedPlacementEstimateStore, query: WeightedPlacementEstimateQuery): WeightedPlacementEstimate[] {
  return query.apply(store.list());
}
