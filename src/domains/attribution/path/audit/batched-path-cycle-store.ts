import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedPathCycle } from "./batched-path-cycle.js";

/** Keeps batched path cycles by code. */
export interface BatchedPathCycleStore {
  find(code: string): BatchedPathCycle | undefined;
  save(item: BatchedPathCycle): void;
  remove(code: string): boolean;
  list(): BatchedPathCycle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedPathCycleStore implements BatchedPathCycleStore {
  items: Map<string, BatchedPathCycle>;
  order: string[];

  constructor(items: Map<string, BatchedPathCycle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedPathCycle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedPathCycle): void {
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

  list(): BatchedPathCycle[] {
    const out: BatchedPathCycle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedPathCycleStore(): BatchedPathCycleStore {
  return new MemoryBatchedPathCycleStore(new Map<string, BatchedPathCycle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedPathCycleStore implements BatchedPathCycleStore {
  inner: BatchedPathCycleStore;
  cache: cache.TtlCache<BatchedPathCycle>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedPathCycleStore,
    cacheValue: cache.TtlCache<BatchedPathCycle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedPathCycle | undefined {
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

  save(item: BatchedPathCycle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedPathCycle[] {
    return this.inner.list();
  }
}

export function newCachedBatchedPathCycleStore(inner: BatchedPathCycleStore, ttl: number, clockValue: clock.Clock): BatchedPathCycleStore {
  return new CachedBatchedPathCycleStore(inner, cache.newTtlCache<BatchedPathCycle>(64, ttl, clockValue), 0, 0);
}

/** Selects batched path cycles. Empty fields match all. */
export class BatchedPathCycleQuery {
  region: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minAmount: number, statuses: string[], limit: number) {
    this.region = region;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedPathCycle): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedPathCycle[]): BatchedPathCycle[] {
    const matched = collections.filter(items, (candidate: BatchedPathCycle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedPathCycles(store: BatchedPathCycleStore, query: BatchedPathCycleQuery): BatchedPathCycle[] {
  return query.apply(store.list());
}
