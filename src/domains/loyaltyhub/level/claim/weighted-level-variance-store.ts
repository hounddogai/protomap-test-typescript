import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedLevelVariance } from "./weighted-level-variance.js";

/** Keeps weighted level variances by code. */
export interface WeightedLevelVarianceStore {
  find(code: string): WeightedLevelVariance | undefined;
  save(item: WeightedLevelVariance): void;
  remove(code: string): boolean;
  list(): WeightedLevelVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedLevelVarianceStore implements WeightedLevelVarianceStore {
  items: Map<string, WeightedLevelVariance>;
  order: string[];

  constructor(items: Map<string, WeightedLevelVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedLevelVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedLevelVariance): void {
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

  list(): WeightedLevelVariance[] {
    const out: WeightedLevelVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedLevelVarianceStore(): WeightedLevelVarianceStore {
  return new MemoryWeightedLevelVarianceStore(new Map<string, WeightedLevelVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedLevelVarianceStore implements WeightedLevelVarianceStore {
  inner: WeightedLevelVarianceStore;
  cache: cache.TtlCache<WeightedLevelVariance>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedLevelVarianceStore,
    cacheValue: cache.TtlCache<WeightedLevelVariance>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedLevelVariance | undefined {
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

  save(item: WeightedLevelVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedLevelVariance[] {
    return this.inner.list();
  }
}

export function newCachedWeightedLevelVarianceStore(inner: WeightedLevelVarianceStore, ttl: number, clockValue: clock.Clock): WeightedLevelVarianceStore {
  return new CachedWeightedLevelVarianceStore(
    inner,
    cache.newTtlCache<WeightedLevelVariance>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted level variances. Empty fields match all. */
export class WeightedLevelVarianceQuery {
  label: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minBatchSize: number, statuses: string[], limit: number) {
    this.label = label;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedLevelVariance): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedLevelVariance[]): WeightedLevelVariance[] {
    const matched = collections.filter(items, (candidate: WeightedLevelVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedLevelVariances(store: WeightedLevelVarianceStore, query: WeightedLevelVarianceQuery): WeightedLevelVariance[] {
  return query.apply(store.list());
}
