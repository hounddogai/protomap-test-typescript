import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedFunnelAdjustment } from "./weighted-funnel-adjustment.js";

/** Keeps weighted funnel adjustments by code. */
export interface WeightedFunnelAdjustmentStore {
  find(code: string): WeightedFunnelAdjustment | undefined;
  save(item: WeightedFunnelAdjustment): void;
  remove(code: string): boolean;
  list(): WeightedFunnelAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedFunnelAdjustmentStore implements WeightedFunnelAdjustmentStore {
  items: Map<string, WeightedFunnelAdjustment>;
  order: string[];

  constructor(items: Map<string, WeightedFunnelAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedFunnelAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedFunnelAdjustment): void {
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

  list(): WeightedFunnelAdjustment[] {
    const out: WeightedFunnelAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedFunnelAdjustmentStore(): WeightedFunnelAdjustmentStore {
  return new MemoryWeightedFunnelAdjustmentStore(new Map<string, WeightedFunnelAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedFunnelAdjustmentStore implements WeightedFunnelAdjustmentStore {
  inner: WeightedFunnelAdjustmentStore;
  cache: cache.TtlCache<WeightedFunnelAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedFunnelAdjustmentStore,
    cacheValue: cache.TtlCache<WeightedFunnelAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedFunnelAdjustment | undefined {
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

  save(item: WeightedFunnelAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedFunnelAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedWeightedFunnelAdjustmentStore(inner: WeightedFunnelAdjustmentStore, ttl: number, clockValue: clock.Clock): WeightedFunnelAdjustmentStore {
  return new CachedWeightedFunnelAdjustmentStore(
    inner,
    cache.newTtlCache<WeightedFunnelAdjustment>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted funnel adjustments. Empty fields match all. */
export class WeightedFunnelAdjustmentQuery {
  locale: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minAttempts: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedFunnelAdjustment): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedFunnelAdjustment[]): WeightedFunnelAdjustment[] {
    const matched = collections.filter(items, (candidate: WeightedFunnelAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedFunnelAdjustments(store: WeightedFunnelAdjustmentStore, query: WeightedFunnelAdjustmentQuery): WeightedFunnelAdjustment[] {
  return query.apply(store.list());
}
