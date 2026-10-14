import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedFraudCheckBundle } from "./weighted-fraud-check-bundle.js";

/** Keeps weighted fraud check bundles by code. */
export interface WeightedFraudCheckBundleStore {
  find(code: string): WeightedFraudCheckBundle | undefined;
  save(item: WeightedFraudCheckBundle): void;
  remove(code: string): boolean;
  list(): WeightedFraudCheckBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedFraudCheckBundleStore implements WeightedFraudCheckBundleStore {
  items: Map<string, WeightedFraudCheckBundle>;
  order: string[];

  constructor(items: Map<string, WeightedFraudCheckBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedFraudCheckBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedFraudCheckBundle): void {
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

  list(): WeightedFraudCheckBundle[] {
    const out: WeightedFraudCheckBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedFraudCheckBundleStore(): WeightedFraudCheckBundleStore {
  return new MemoryWeightedFraudCheckBundleStore(new Map<string, WeightedFraudCheckBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedFraudCheckBundleStore implements WeightedFraudCheckBundleStore {
  inner: WeightedFraudCheckBundleStore;
  cache: cache.TtlCache<WeightedFraudCheckBundle>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedFraudCheckBundleStore,
    cacheValue: cache.TtlCache<WeightedFraudCheckBundle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedFraudCheckBundle | undefined {
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

  save(item: WeightedFraudCheckBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedFraudCheckBundle[] {
    return this.inner.list();
  }
}

export function newCachedWeightedFraudCheckBundleStore(inner: WeightedFraudCheckBundleStore, ttl: number, clockValue: clock.Clock): WeightedFraudCheckBundleStore {
  return new CachedWeightedFraudCheckBundleStore(
    inner,
    cache.newTtlCache<WeightedFraudCheckBundle>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted fraud check bundles. Empty fields match all. */
export class WeightedFraudCheckBundleQuery {
  label: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedFraudCheckBundle): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedFraudCheckBundle[]): WeightedFraudCheckBundle[] {
    const matched = collections.filter(items, (candidate: WeightedFraudCheckBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedFraudCheckBundles(store: WeightedFraudCheckBundleStore, query: WeightedFraudCheckBundleQuery): WeightedFraudCheckBundle[] {
  return query.apply(store.list());
}
