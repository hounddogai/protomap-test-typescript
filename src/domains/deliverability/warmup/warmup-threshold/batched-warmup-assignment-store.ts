import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedWarmupAssignment } from "./batched-warmup-assignment.js";

/** Keeps batched warmup assignments by code. */
export interface BatchedWarmupAssignmentStore {
  find(code: string): BatchedWarmupAssignment | undefined;
  save(item: BatchedWarmupAssignment): void;
  remove(code: string): boolean;
  list(): BatchedWarmupAssignment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedWarmupAssignmentStore implements BatchedWarmupAssignmentStore {
  items: Map<string, BatchedWarmupAssignment>;
  order: string[];

  constructor(items: Map<string, BatchedWarmupAssignment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedWarmupAssignment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedWarmupAssignment): void {
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

  list(): BatchedWarmupAssignment[] {
    const out: BatchedWarmupAssignment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedWarmupAssignmentStore(): BatchedWarmupAssignmentStore {
  return new MemoryBatchedWarmupAssignmentStore(new Map<string, BatchedWarmupAssignment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedWarmupAssignmentStore implements BatchedWarmupAssignmentStore {
  inner: BatchedWarmupAssignmentStore;
  cache: cache.TtlCache<BatchedWarmupAssignment>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedWarmupAssignmentStore,
    cacheValue: cache.TtlCache<BatchedWarmupAssignment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedWarmupAssignment | undefined {
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

  save(item: BatchedWarmupAssignment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedWarmupAssignment[] {
    return this.inner.list();
  }
}

export function newCachedBatchedWarmupAssignmentStore(inner: BatchedWarmupAssignmentStore, ttl: number, clockValue: clock.Clock): BatchedWarmupAssignmentStore {
  return new CachedBatchedWarmupAssignmentStore(
    inner,
    cache.newTtlCache<BatchedWarmupAssignment>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched warmup assignments. Empty fields match all. */
export class BatchedWarmupAssignmentQuery {
  label: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minCost: number, statuses: string[], limit: number) {
    this.label = label;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedWarmupAssignment): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedWarmupAssignment[]): BatchedWarmupAssignment[] {
    const matched = collections.filter(items, (candidate: BatchedWarmupAssignment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedWarmupAssignments(store: BatchedWarmupAssignmentStore, query: BatchedWarmupAssignmentQuery): BatchedWarmupAssignment[] {
  return query.apply(store.list());
}
