import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SubscriptionMetric } from "./subscription-metric.js";

/** Keeps subscription metrics by code. */
export interface SubscriptionMetricStore {
  find(code: string): SubscriptionMetric | undefined;
  save(item: SubscriptionMetric): void;
  remove(code: string): boolean;
  list(): SubscriptionMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySubscriptionMetricStore implements SubscriptionMetricStore {
  items: Map<string, SubscriptionMetric>;
  order: string[];

  constructor(items: Map<string, SubscriptionMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SubscriptionMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SubscriptionMetric): void {
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

  list(): SubscriptionMetric[] {
    const out: SubscriptionMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySubscriptionMetricStore(): SubscriptionMetricStore {
  return new MemorySubscriptionMetricStore(new Map<string, SubscriptionMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSubscriptionMetricStore implements SubscriptionMetricStore {
  inner: SubscriptionMetricStore;
  cache: cache.TtlCache<SubscriptionMetric>;
  hits: number;
  misses: number;

  constructor(
    inner: SubscriptionMetricStore,
    cacheValue: cache.TtlCache<SubscriptionMetric>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SubscriptionMetric | undefined {
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

  save(item: SubscriptionMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SubscriptionMetric[] {
    return this.inner.list();
  }
}

export function newCachedSubscriptionMetricStore(inner: SubscriptionMetricStore, ttl: number, clockValue: clock.Clock): SubscriptionMetricStore {
  return new CachedSubscriptionMetricStore(inner, cache.newTtlCache<SubscriptionMetric>(256, ttl, clockValue), 0, 0);
}

/** Selects subscription metrics. Empty fields match all. */
export class SubscriptionMetricQuery {
  segment: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minMinimum: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SubscriptionMetric): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SubscriptionMetric[]): SubscriptionMetric[] {
    const matched = collections.filter(items, (candidate: SubscriptionMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSubscriptionMetrics(store: SubscriptionMetricStore, query: SubscriptionMetricQuery): SubscriptionMetric[] {
  return query.apply(store.list());
}
