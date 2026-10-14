import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FraudCheckMetric } from "./fraud-check-metric.js";

/** Keeps fraud check metrics by code. */
export interface FraudCheckMetricStore {
  find(code: string): FraudCheckMetric | undefined;
  save(item: FraudCheckMetric): void;
  remove(code: string): boolean;
  list(): FraudCheckMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFraudCheckMetricStore implements FraudCheckMetricStore {
  items: Map<string, FraudCheckMetric>;
  order: string[];

  constructor(items: Map<string, FraudCheckMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FraudCheckMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FraudCheckMetric): void {
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

  list(): FraudCheckMetric[] {
    const out: FraudCheckMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFraudCheckMetricStore(): FraudCheckMetricStore {
  return new MemoryFraudCheckMetricStore(new Map<string, FraudCheckMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFraudCheckMetricStore implements FraudCheckMetricStore {
  inner: FraudCheckMetricStore;
  cache: cache.TtlCache<FraudCheckMetric>;
  hits: number;
  misses: number;

  constructor(
    inner: FraudCheckMetricStore,
    cacheValue: cache.TtlCache<FraudCheckMetric>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FraudCheckMetric | undefined {
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

  save(item: FraudCheckMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FraudCheckMetric[] {
    return this.inner.list();
  }
}

export function newCachedFraudCheckMetricStore(inner: FraudCheckMetricStore, ttl: number, clockValue: clock.Clock): FraudCheckMetricStore {
  return new CachedFraudCheckMetricStore(inner, cache.newTtlCache<FraudCheckMetric>(1024, ttl, clockValue), 0, 0);
}

/** Selects fraud check metrics. Empty fields match all. */
export class FraudCheckMetricQuery {
  country: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minBudget: number, statuses: string[], limit: number) {
    this.country = country;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FraudCheckMetric): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FraudCheckMetric[]): FraudCheckMetric[] {
    const matched = collections.filter(items, (candidate: FraudCheckMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFraudCheckMetrics(store: FraudCheckMetricStore, query: FraudCheckMetricQuery): FraudCheckMetric[] {
  return query.apply(store.list());
}
