import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedFlightVariance } from "./weighted-flight-variance.js";

/** Keeps weighted flight variances by code. */
export interface WeightedFlightVarianceStore {
  find(code: string): WeightedFlightVariance | undefined;
  save(item: WeightedFlightVariance): void;
  remove(code: string): boolean;
  list(): WeightedFlightVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedFlightVarianceStore implements WeightedFlightVarianceStore {
  items: Map<string, WeightedFlightVariance>;
  order: string[];

  constructor(items: Map<string, WeightedFlightVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedFlightVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedFlightVariance): void {
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

  list(): WeightedFlightVariance[] {
    const out: WeightedFlightVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedFlightVarianceStore(): WeightedFlightVarianceStore {
  return new MemoryWeightedFlightVarianceStore(new Map<string, WeightedFlightVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedFlightVarianceStore implements WeightedFlightVarianceStore {
  inner: WeightedFlightVarianceStore;
  cache: cache.TtlCache<WeightedFlightVariance>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedFlightVarianceStore,
    cacheValue: cache.TtlCache<WeightedFlightVariance>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedFlightVariance | undefined {
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

  save(item: WeightedFlightVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedFlightVariance[] {
    return this.inner.list();
  }
}

export function newCachedWeightedFlightVarianceStore(inner: WeightedFlightVarianceStore, ttl: number, clockValue: clock.Clock): WeightedFlightVarianceStore {
  return new CachedWeightedFlightVarianceStore(
    inner,
    cache.newTtlCache<WeightedFlightVariance>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted flight variances. Empty fields match all. */
export class WeightedFlightVarianceQuery {
  region: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minFloorValue: number, statuses: string[], limit: number) {
    this.region = region;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedFlightVariance): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedFlightVariance[]): WeightedFlightVariance[] {
    const matched = collections.filter(items, (candidate: WeightedFlightVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedFlightVariances(store: WeightedFlightVarianceStore, query: WeightedFlightVarianceQuery): WeightedFlightVariance[] {
  return query.apply(store.list());
}
