import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedCohortAllocation } from "./batched-cohort-allocation.js";

/** Keeps batched cohort allocations by code. */
export interface BatchedCohortAllocationStore {
  find(code: string): BatchedCohortAllocation | undefined;
  save(item: BatchedCohortAllocation): void;
  remove(code: string): boolean;
  list(): BatchedCohortAllocation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedCohortAllocationStore implements BatchedCohortAllocationStore {
  items: Map<string, BatchedCohortAllocation>;
  order: string[];

  constructor(items: Map<string, BatchedCohortAllocation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedCohortAllocation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedCohortAllocation): void {
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

  list(): BatchedCohortAllocation[] {
    const out: BatchedCohortAllocation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedCohortAllocationStore(): BatchedCohortAllocationStore {
  return new MemoryBatchedCohortAllocationStore(new Map<string, BatchedCohortAllocation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedCohortAllocationStore implements BatchedCohortAllocationStore {
  inner: BatchedCohortAllocationStore;
  cache: cache.TtlCache<BatchedCohortAllocation>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedCohortAllocationStore,
    cacheValue: cache.TtlCache<BatchedCohortAllocation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedCohortAllocation | undefined {
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

  save(item: BatchedCohortAllocation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedCohortAllocation[] {
    return this.inner.list();
  }
}

export function newCachedBatchedCohortAllocationStore(inner: BatchedCohortAllocationStore, ttl: number, clockValue: clock.Clock): BatchedCohortAllocationStore {
  return new CachedBatchedCohortAllocationStore(
    inner,
    cache.newTtlCache<BatchedCohortAllocation>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched cohort allocations. Empty fields match all. */
export class BatchedCohortAllocationQuery {
  utmSource: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minVersion: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedCohortAllocation): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedCohortAllocation[]): BatchedCohortAllocation[] {
    const matched = collections.filter(items, (candidate: BatchedCohortAllocation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedCohortAllocations(store: BatchedCohortAllocationStore, query: BatchedCohortAllocationQuery): BatchedCohortAllocation[] {
  return query.apply(store.list());
}
