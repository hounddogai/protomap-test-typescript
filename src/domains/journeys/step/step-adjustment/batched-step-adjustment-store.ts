import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedStepAdjustment } from "./batched-step-adjustment.js";

/** Keeps batched step adjustments by code. */
export interface BatchedStepAdjustmentStore {
  find(code: string): BatchedStepAdjustment | undefined;
  save(item: BatchedStepAdjustment): void;
  remove(code: string): boolean;
  list(): BatchedStepAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedStepAdjustmentStore implements BatchedStepAdjustmentStore {
  items: Map<string, BatchedStepAdjustment>;
  order: string[];

  constructor(items: Map<string, BatchedStepAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedStepAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedStepAdjustment): void {
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

  list(): BatchedStepAdjustment[] {
    const out: BatchedStepAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedStepAdjustmentStore(): BatchedStepAdjustmentStore {
  return new MemoryBatchedStepAdjustmentStore(new Map<string, BatchedStepAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedStepAdjustmentStore implements BatchedStepAdjustmentStore {
  inner: BatchedStepAdjustmentStore;
  cache: cache.TtlCache<BatchedStepAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedStepAdjustmentStore,
    cacheValue: cache.TtlCache<BatchedStepAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedStepAdjustment | undefined {
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

  save(item: BatchedStepAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedStepAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedBatchedStepAdjustmentStore(inner: BatchedStepAdjustmentStore, ttl: number, clockValue: clock.Clock): BatchedStepAdjustmentStore {
  return new CachedBatchedStepAdjustmentStore(
    inner,
    cache.newTtlCache<BatchedStepAdjustment>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched step adjustments. Empty fields match all. */
export class BatchedStepAdjustmentQuery {
  segment: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minWeight: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedStepAdjustment): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedStepAdjustment[]): BatchedStepAdjustment[] {
    const matched = collections.filter(items, (candidate: BatchedStepAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedStepAdjustments(store: BatchedStepAdjustmentStore, query: BatchedStepAdjustmentQuery): BatchedStepAdjustment[] {
  return query.apply(store.list());
}
