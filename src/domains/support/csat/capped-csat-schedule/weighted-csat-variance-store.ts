import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedCsatVariance } from "./weighted-csat-variance.js";

/** Keeps weighted csat variances by code. */
export interface WeightedCsatVarianceStore {
  find(code: string): WeightedCsatVariance | undefined;
  save(item: WeightedCsatVariance): void;
  remove(code: string): boolean;
  list(): WeightedCsatVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedCsatVarianceStore implements WeightedCsatVarianceStore {
  items: Map<string, WeightedCsatVariance>;
  order: string[];

  constructor(items: Map<string, WeightedCsatVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedCsatVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedCsatVariance): void {
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

  list(): WeightedCsatVariance[] {
    const out: WeightedCsatVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedCsatVarianceStore(): WeightedCsatVarianceStore {
  return new MemoryWeightedCsatVarianceStore(new Map<string, WeightedCsatVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedCsatVarianceStore implements WeightedCsatVarianceStore {
  inner: WeightedCsatVarianceStore;
  cache: cache.TtlCache<WeightedCsatVariance>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedCsatVarianceStore,
    cacheValue: cache.TtlCache<WeightedCsatVariance>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedCsatVariance | undefined {
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

  save(item: WeightedCsatVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedCsatVariance[] {
    return this.inner.list();
  }
}

export function newCachedWeightedCsatVarianceStore(inner: WeightedCsatVarianceStore, ttl: number, clockValue: clock.Clock): WeightedCsatVarianceStore {
  return new CachedWeightedCsatVarianceStore(
    inner,
    cache.newTtlCache<WeightedCsatVariance>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted csat variances. Empty fields match all. */
export class WeightedCsatVarianceQuery {
  name: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minRevision: number, statuses: string[], limit: number) {
    this.name = name;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedCsatVariance): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedCsatVariance[]): WeightedCsatVariance[] {
    const matched = collections.filter(items, (candidate: WeightedCsatVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedCsatVariances(store: WeightedCsatVarianceStore, query: WeightedCsatVarianceQuery): WeightedCsatVariance[] {
  return query.apply(store.list());
}
