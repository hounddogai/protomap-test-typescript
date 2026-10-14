import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedComplaintEstimate } from "./batched-complaint-estimate.js";

/** Keeps batched complaint estimates by code. */
export interface BatchedComplaintEstimateStore {
  find(code: string): BatchedComplaintEstimate | undefined;
  save(item: BatchedComplaintEstimate): void;
  remove(code: string): boolean;
  list(): BatchedComplaintEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedComplaintEstimateStore implements BatchedComplaintEstimateStore {
  items: Map<string, BatchedComplaintEstimate>;
  order: string[];

  constructor(items: Map<string, BatchedComplaintEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedComplaintEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedComplaintEstimate): void {
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

  list(): BatchedComplaintEstimate[] {
    const out: BatchedComplaintEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedComplaintEstimateStore(): BatchedComplaintEstimateStore {
  return new MemoryBatchedComplaintEstimateStore(new Map<string, BatchedComplaintEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedComplaintEstimateStore implements BatchedComplaintEstimateStore {
  inner: BatchedComplaintEstimateStore;
  cache: cache.TtlCache<BatchedComplaintEstimate>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedComplaintEstimateStore,
    cacheValue: cache.TtlCache<BatchedComplaintEstimate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedComplaintEstimate | undefined {
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

  save(item: BatchedComplaintEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedComplaintEstimate[] {
    return this.inner.list();
  }
}

export function newCachedBatchedComplaintEstimateStore(inner: BatchedComplaintEstimateStore, ttl: number, clockValue: clock.Clock): BatchedComplaintEstimateStore {
  return new CachedBatchedComplaintEstimateStore(
    inner,
    cache.newTtlCache<BatchedComplaintEstimate>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched complaint estimates. Empty fields match all. */
export class BatchedComplaintEstimateQuery {
  label: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minRatio: number, statuses: string[], limit: number) {
    this.label = label;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedComplaintEstimate): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedComplaintEstimate[]): BatchedComplaintEstimate[] {
    const matched = collections.filter(items, (candidate: BatchedComplaintEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedComplaintEstimates(store: BatchedComplaintEstimateStore, query: BatchedComplaintEstimateQuery): BatchedComplaintEstimate[] {
  return query.apply(store.list());
}
