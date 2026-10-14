import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedInsightAllocation } from "./batched-insight-allocation.js";

/** Keeps batched insight allocations by code. */
export interface BatchedInsightAllocationStore {
  find(code: string): BatchedInsightAllocation | undefined;
  save(item: BatchedInsightAllocation): void;
  remove(code: string): boolean;
  list(): BatchedInsightAllocation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedInsightAllocationStore implements BatchedInsightAllocationStore {
  items: Map<string, BatchedInsightAllocation>;
  order: string[];

  constructor(items: Map<string, BatchedInsightAllocation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedInsightAllocation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedInsightAllocation): void {
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

  list(): BatchedInsightAllocation[] {
    const out: BatchedInsightAllocation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedInsightAllocationStore(): BatchedInsightAllocationStore {
  return new MemoryBatchedInsightAllocationStore(new Map<string, BatchedInsightAllocation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedInsightAllocationStore implements BatchedInsightAllocationStore {
  inner: BatchedInsightAllocationStore;
  cache: cache.TtlCache<BatchedInsightAllocation>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedInsightAllocationStore,
    cacheValue: cache.TtlCache<BatchedInsightAllocation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedInsightAllocation | undefined {
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

  save(item: BatchedInsightAllocation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedInsightAllocation[] {
    return this.inner.list();
  }
}

export function newCachedBatchedInsightAllocationStore(inner: BatchedInsightAllocationStore, ttl: number, clockValue: clock.Clock): BatchedInsightAllocationStore {
  return new CachedBatchedInsightAllocationStore(
    inner,
    cache.newTtlCache<BatchedInsightAllocation>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched insight allocations. Empty fields match all. */
export class BatchedInsightAllocationQuery {
  source: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minFloorValue: number, statuses: string[], limit: number) {
    this.source = source;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedInsightAllocation): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedInsightAllocation[]): BatchedInsightAllocation[] {
    const matched = collections.filter(items, (candidate: BatchedInsightAllocation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedInsightAllocations(store: BatchedInsightAllocationStore, query: BatchedInsightAllocationQuery): BatchedInsightAllocation[] {
  return query.apply(store.list());
}
