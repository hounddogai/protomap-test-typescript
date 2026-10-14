import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedCsatMetric } from "./batched-csat-metric.js";

/** Keeps batched csat metrics by code. */
export interface BatchedCsatMetricStore {
  find(code: string): BatchedCsatMetric | undefined;
  save(item: BatchedCsatMetric): void;
  remove(code: string): boolean;
  list(): BatchedCsatMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedCsatMetricStore implements BatchedCsatMetricStore {
  items: Map<string, BatchedCsatMetric>;
  order: string[];

  constructor(items: Map<string, BatchedCsatMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedCsatMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedCsatMetric): void {
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

  list(): BatchedCsatMetric[] {
    const out: BatchedCsatMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedCsatMetricStore(): BatchedCsatMetricStore {
  return new MemoryBatchedCsatMetricStore(new Map<string, BatchedCsatMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedCsatMetricStore implements BatchedCsatMetricStore {
  inner: BatchedCsatMetricStore;
  cache: cache.TtlCache<BatchedCsatMetric>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedCsatMetricStore,
    cacheValue: cache.TtlCache<BatchedCsatMetric>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedCsatMetric | undefined {
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

  save(item: BatchedCsatMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedCsatMetric[] {
    return this.inner.list();
  }
}

export function newCachedBatchedCsatMetricStore(inner: BatchedCsatMetricStore, ttl: number, clockValue: clock.Clock): BatchedCsatMetricStore {
  return new CachedBatchedCsatMetricStore(inner, cache.newTtlCache<BatchedCsatMetric>(256, ttl, clockValue), 0, 0);
}

/** Selects batched csat metrics. Empty fields match all. */
export class BatchedCsatMetricQuery {
  country: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minDiscount: number, statuses: string[], limit: number) {
    this.country = country;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedCsatMetric): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedCsatMetric[]): BatchedCsatMetric[] {
    const matched = collections.filter(items, (candidate: BatchedCsatMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedCsatMetrics(store: BatchedCsatMetricStore, query: BatchedCsatMetricQuery): BatchedCsatMetric[] {
  return query.apply(store.list());
}
