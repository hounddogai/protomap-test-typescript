import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedWarmupThreshold } from "./weighted-warmup-threshold.js";

/** Keeps weighted warmup thresholds by code. */
export interface WeightedWarmupThresholdStore {
  find(code: string): WeightedWarmupThreshold | undefined;
  save(item: WeightedWarmupThreshold): void;
  remove(code: string): boolean;
  list(): WeightedWarmupThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedWarmupThresholdStore implements WeightedWarmupThresholdStore {
  items: Map<string, WeightedWarmupThreshold>;
  order: string[];

  constructor(items: Map<string, WeightedWarmupThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedWarmupThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedWarmupThreshold): void {
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

  list(): WeightedWarmupThreshold[] {
    const out: WeightedWarmupThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedWarmupThresholdStore(): WeightedWarmupThresholdStore {
  return new MemoryWeightedWarmupThresholdStore(new Map<string, WeightedWarmupThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedWarmupThresholdStore implements WeightedWarmupThresholdStore {
  inner: WeightedWarmupThresholdStore;
  cache: cache.TtlCache<WeightedWarmupThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedWarmupThresholdStore,
    cacheValue: cache.TtlCache<WeightedWarmupThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedWarmupThreshold | undefined {
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

  save(item: WeightedWarmupThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedWarmupThreshold[] {
    return this.inner.list();
  }
}

export function newCachedWeightedWarmupThresholdStore(inner: WeightedWarmupThresholdStore, ttl: number, clockValue: clock.Clock): WeightedWarmupThresholdStore {
  return new CachedWeightedWarmupThresholdStore(
    inner,
    cache.newTtlCache<WeightedWarmupThreshold>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted warmup thresholds. Empty fields match all. */
export class WeightedWarmupThresholdQuery {
  region: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minCost: number, statuses: string[], limit: number) {
    this.region = region;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedWarmupThreshold): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedWarmupThreshold[]): WeightedWarmupThreshold[] {
    const matched = collections.filter(items, (candidate: WeightedWarmupThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedWarmupThresholds(store: WeightedWarmupThresholdStore, query: WeightedWarmupThresholdQuery): WeightedWarmupThreshold[] {
  return query.apply(store.list());
}
