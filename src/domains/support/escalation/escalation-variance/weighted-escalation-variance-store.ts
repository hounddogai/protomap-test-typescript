import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedEscalationVariance } from "./weighted-escalation-variance.js";

/** Keeps weighted escalation variances by code. */
export interface WeightedEscalationVarianceStore {
  find(code: string): WeightedEscalationVariance | undefined;
  save(item: WeightedEscalationVariance): void;
  remove(code: string): boolean;
  list(): WeightedEscalationVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedEscalationVarianceStore implements WeightedEscalationVarianceStore {
  items: Map<string, WeightedEscalationVariance>;
  order: string[];

  constructor(items: Map<string, WeightedEscalationVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedEscalationVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedEscalationVariance): void {
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

  list(): WeightedEscalationVariance[] {
    const out: WeightedEscalationVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedEscalationVarianceStore(): WeightedEscalationVarianceStore {
  return new MemoryWeightedEscalationVarianceStore(new Map<string, WeightedEscalationVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedEscalationVarianceStore implements WeightedEscalationVarianceStore {
  inner: WeightedEscalationVarianceStore;
  cache: cache.TtlCache<WeightedEscalationVariance>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedEscalationVarianceStore,
    cacheValue: cache.TtlCache<WeightedEscalationVariance>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedEscalationVariance | undefined {
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

  save(item: WeightedEscalationVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedEscalationVariance[] {
    return this.inner.list();
  }
}

export function newCachedWeightedEscalationVarianceStore(inner: WeightedEscalationVarianceStore, ttl: number, clockValue: clock.Clock): WeightedEscalationVarianceStore {
  return new CachedWeightedEscalationVarianceStore(
    inner,
    cache.newTtlCache<WeightedEscalationVariance>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted escalation variances. Empty fields match all. */
export class WeightedEscalationVarianceQuery {
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

  matches(item: WeightedEscalationVariance): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedEscalationVariance[]): WeightedEscalationVariance[] {
    const matched = collections.filter(items, (candidate: WeightedEscalationVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedEscalationVariances(store: WeightedEscalationVarianceStore, query: WeightedEscalationVarianceQuery): WeightedEscalationVariance[] {
  return query.apply(store.list());
}
