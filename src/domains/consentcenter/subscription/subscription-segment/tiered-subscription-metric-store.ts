import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredSubscriptionMetric } from "./tiered-subscription-metric.js";

/** Keeps tiered subscription metrics by code. */
export interface TieredSubscriptionMetricStore {
  find(code: string): TieredSubscriptionMetric | undefined;
  save(item: TieredSubscriptionMetric): void;
  remove(code: string): boolean;
  list(): TieredSubscriptionMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredSubscriptionMetricStore implements TieredSubscriptionMetricStore {
  items: Map<string, TieredSubscriptionMetric>;
  order: string[];

  constructor(items: Map<string, TieredSubscriptionMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredSubscriptionMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredSubscriptionMetric): void {
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

  list(): TieredSubscriptionMetric[] {
    const out: TieredSubscriptionMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredSubscriptionMetricStore(): TieredSubscriptionMetricStore {
  return new MemoryTieredSubscriptionMetricStore(new Map<string, TieredSubscriptionMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredSubscriptionMetricStore implements TieredSubscriptionMetricStore {
  inner: TieredSubscriptionMetricStore;
  cache: cache.TtlCache<TieredSubscriptionMetric>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredSubscriptionMetricStore,
    cacheValue: cache.TtlCache<TieredSubscriptionMetric>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredSubscriptionMetric | undefined {
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

  save(item: TieredSubscriptionMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredSubscriptionMetric[] {
    return this.inner.list();
  }
}

export function newCachedTieredSubscriptionMetricStore(inner: TieredSubscriptionMetricStore, ttl: number, clockValue: clock.Clock): TieredSubscriptionMetricStore {
  return new CachedTieredSubscriptionMetricStore(
    inner,
    cache.newTtlCache<TieredSubscriptionMetric>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered subscription metrics. Empty fields match all. */
export class TieredSubscriptionMetricQuery {
  utmSource: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minCost: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredSubscriptionMetric): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredSubscriptionMetric[]): TieredSubscriptionMetric[] {
    const matched = collections.filter(items, (candidate: TieredSubscriptionMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredSubscriptionMetrics(store: TieredSubscriptionMetricStore, query: TieredSubscriptionMetricQuery): TieredSubscriptionMetric[] {
  return query.apply(store.list());
}
