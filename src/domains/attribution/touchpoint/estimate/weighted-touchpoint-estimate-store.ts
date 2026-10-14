import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedTouchpointEstimate } from "./weighted-touchpoint-estimate.js";

/** Keeps weighted touchpoint estimates by code. */
export interface WeightedTouchpointEstimateStore {
  find(code: string): WeightedTouchpointEstimate | undefined;
  save(item: WeightedTouchpointEstimate): void;
  remove(code: string): boolean;
  list(): WeightedTouchpointEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedTouchpointEstimateStore implements WeightedTouchpointEstimateStore {
  items: Map<string, WeightedTouchpointEstimate>;
  order: string[];

  constructor(items: Map<string, WeightedTouchpointEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedTouchpointEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedTouchpointEstimate): void {
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

  list(): WeightedTouchpointEstimate[] {
    const out: WeightedTouchpointEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedTouchpointEstimateStore(): WeightedTouchpointEstimateStore {
  return new MemoryWeightedTouchpointEstimateStore(new Map<string, WeightedTouchpointEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedTouchpointEstimateStore implements WeightedTouchpointEstimateStore {
  inner: WeightedTouchpointEstimateStore;
  cache: cache.TtlCache<WeightedTouchpointEstimate>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedTouchpointEstimateStore,
    cacheValue: cache.TtlCache<WeightedTouchpointEstimate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedTouchpointEstimate | undefined {
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

  save(item: WeightedTouchpointEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedTouchpointEstimate[] {
    return this.inner.list();
  }
}

export function newCachedWeightedTouchpointEstimateStore(inner: WeightedTouchpointEstimateStore, ttl: number, clockValue: clock.Clock): WeightedTouchpointEstimateStore {
  return new CachedWeightedTouchpointEstimateStore(
    inner,
    cache.newTtlCache<WeightedTouchpointEstimate>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted touchpoint estimates. Empty fields match all. */
export class WeightedTouchpointEstimateQuery {
  name: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minRate: number, statuses: string[], limit: number) {
    this.name = name;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedTouchpointEstimate): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedTouchpointEstimate[]): WeightedTouchpointEstimate[] {
    const matched = collections.filter(items, (candidate: WeightedTouchpointEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedTouchpointEstimates(store: WeightedTouchpointEstimateStore, query: WeightedTouchpointEstimateQuery): WeightedTouchpointEstimate[] {
  return query.apply(store.list());
}
