import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedExitRuleMetric } from "./batched-exit-rule-metric.js";

/** Keeps batched exit rule metrics by code. */
export interface BatchedExitRuleMetricStore {
  find(code: string): BatchedExitRuleMetric | undefined;
  save(item: BatchedExitRuleMetric): void;
  remove(code: string): boolean;
  list(): BatchedExitRuleMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedExitRuleMetricStore implements BatchedExitRuleMetricStore {
  items: Map<string, BatchedExitRuleMetric>;
  order: string[];

  constructor(items: Map<string, BatchedExitRuleMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedExitRuleMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedExitRuleMetric): void {
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

  list(): BatchedExitRuleMetric[] {
    const out: BatchedExitRuleMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedExitRuleMetricStore(): BatchedExitRuleMetricStore {
  return new MemoryBatchedExitRuleMetricStore(new Map<string, BatchedExitRuleMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedExitRuleMetricStore implements BatchedExitRuleMetricStore {
  inner: BatchedExitRuleMetricStore;
  cache: cache.TtlCache<BatchedExitRuleMetric>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedExitRuleMetricStore,
    cacheValue: cache.TtlCache<BatchedExitRuleMetric>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedExitRuleMetric | undefined {
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

  save(item: BatchedExitRuleMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedExitRuleMetric[] {
    return this.inner.list();
  }
}

export function newCachedBatchedExitRuleMetricStore(inner: BatchedExitRuleMetricStore, ttl: number, clockValue: clock.Clock): BatchedExitRuleMetricStore {
  return new CachedBatchedExitRuleMetricStore(
    inner,
    cache.newTtlCache<BatchedExitRuleMetric>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched exit rule metrics. Empty fields match all. */
export class BatchedExitRuleMetricQuery {
  locale: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minRatio: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedExitRuleMetric): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedExitRuleMetric[]): BatchedExitRuleMetric[] {
    const matched = collections.filter(items, (candidate: BatchedExitRuleMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedExitRuleMetrics(store: BatchedExitRuleMetricStore, query: BatchedExitRuleMetricQuery): BatchedExitRuleMetric[] {
  return query.apply(store.list());
}
