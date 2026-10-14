import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedFrequencyMetric } from "./batched-frequency-metric.js";

/** Keeps batched frequency metrics by code. */
export interface BatchedFrequencyMetricStore {
  find(code: string): BatchedFrequencyMetric | undefined;
  save(item: BatchedFrequencyMetric): void;
  remove(code: string): boolean;
  list(): BatchedFrequencyMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedFrequencyMetricStore implements BatchedFrequencyMetricStore {
  items: Map<string, BatchedFrequencyMetric>;
  order: string[];

  constructor(items: Map<string, BatchedFrequencyMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedFrequencyMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedFrequencyMetric): void {
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

  list(): BatchedFrequencyMetric[] {
    const out: BatchedFrequencyMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedFrequencyMetricStore(): BatchedFrequencyMetricStore {
  return new MemoryBatchedFrequencyMetricStore(new Map<string, BatchedFrequencyMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedFrequencyMetricStore implements BatchedFrequencyMetricStore {
  inner: BatchedFrequencyMetricStore;
  cache: cache.TtlCache<BatchedFrequencyMetric>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedFrequencyMetricStore,
    cacheValue: cache.TtlCache<BatchedFrequencyMetric>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedFrequencyMetric | undefined {
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

  save(item: BatchedFrequencyMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedFrequencyMetric[] {
    return this.inner.list();
  }
}

export function newCachedBatchedFrequencyMetricStore(inner: BatchedFrequencyMetricStore, ttl: number, clockValue: clock.Clock): BatchedFrequencyMetricStore {
  return new CachedBatchedFrequencyMetricStore(
    inner,
    cache.newTtlCache<BatchedFrequencyMetric>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched frequency metrics. Empty fields match all. */
export class BatchedFrequencyMetricQuery {
  source: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minBudget: number, statuses: string[], limit: number) {
    this.source = source;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedFrequencyMetric): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedFrequencyMetric[]): BatchedFrequencyMetric[] {
    const matched = collections.filter(items, (candidate: BatchedFrequencyMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedFrequencyMetrics(store: BatchedFrequencyMetricStore, query: BatchedFrequencyMetricQuery): BatchedFrequencyMetric[] {
  return query.apply(store.list());
}
