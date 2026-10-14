import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedOptOutAllocation } from "./batched-opt-out-allocation.js";

/** Keeps batched opt out allocations by code. */
export interface BatchedOptOutAllocationStore {
  find(code: string): BatchedOptOutAllocation | undefined;
  save(item: BatchedOptOutAllocation): void;
  remove(code: string): boolean;
  list(): BatchedOptOutAllocation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedOptOutAllocationStore implements BatchedOptOutAllocationStore {
  items: Map<string, BatchedOptOutAllocation>;
  order: string[];

  constructor(items: Map<string, BatchedOptOutAllocation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedOptOutAllocation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedOptOutAllocation): void {
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

  list(): BatchedOptOutAllocation[] {
    const out: BatchedOptOutAllocation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedOptOutAllocationStore(): BatchedOptOutAllocationStore {
  return new MemoryBatchedOptOutAllocationStore(new Map<string, BatchedOptOutAllocation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedOptOutAllocationStore implements BatchedOptOutAllocationStore {
  inner: BatchedOptOutAllocationStore;
  cache: cache.TtlCache<BatchedOptOutAllocation>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedOptOutAllocationStore,
    cacheValue: cache.TtlCache<BatchedOptOutAllocation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedOptOutAllocation | undefined {
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

  save(item: BatchedOptOutAllocation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedOptOutAllocation[] {
    return this.inner.list();
  }
}

export function newCachedBatchedOptOutAllocationStore(inner: BatchedOptOutAllocationStore, ttl: number, clockValue: clock.Clock): BatchedOptOutAllocationStore {
  return new CachedBatchedOptOutAllocationStore(
    inner,
    cache.newTtlCache<BatchedOptOutAllocation>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched opt out allocations. Empty fields match all. */
export class BatchedOptOutAllocationQuery {
  title: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minSendAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedOptOutAllocation): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedOptOutAllocation[]): BatchedOptOutAllocation[] {
    const matched = collections.filter(items, (candidate: BatchedOptOutAllocation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedOptOutAllocations(store: BatchedOptOutAllocationStore, query: BatchedOptOutAllocationQuery): BatchedOptOutAllocation[] {
  return query.apply(store.list());
}
