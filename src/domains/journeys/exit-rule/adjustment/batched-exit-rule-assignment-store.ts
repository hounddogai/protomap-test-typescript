import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedExitRuleAssignment } from "./batched-exit-rule-assignment.js";

/** Keeps batched exit rule assignments by code. */
export interface BatchedExitRuleAssignmentStore {
  find(code: string): BatchedExitRuleAssignment | undefined;
  save(item: BatchedExitRuleAssignment): void;
  remove(code: string): boolean;
  list(): BatchedExitRuleAssignment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedExitRuleAssignmentStore implements BatchedExitRuleAssignmentStore {
  items: Map<string, BatchedExitRuleAssignment>;
  order: string[];

  constructor(items: Map<string, BatchedExitRuleAssignment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedExitRuleAssignment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedExitRuleAssignment): void {
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

  list(): BatchedExitRuleAssignment[] {
    const out: BatchedExitRuleAssignment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedExitRuleAssignmentStore(): BatchedExitRuleAssignmentStore {
  return new MemoryBatchedExitRuleAssignmentStore(new Map<string, BatchedExitRuleAssignment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedExitRuleAssignmentStore implements BatchedExitRuleAssignmentStore {
  inner: BatchedExitRuleAssignmentStore;
  cache: cache.TtlCache<BatchedExitRuleAssignment>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedExitRuleAssignmentStore,
    cacheValue: cache.TtlCache<BatchedExitRuleAssignment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedExitRuleAssignment | undefined {
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

  save(item: BatchedExitRuleAssignment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedExitRuleAssignment[] {
    return this.inner.list();
  }
}

export function newCachedBatchedExitRuleAssignmentStore(inner: BatchedExitRuleAssignmentStore, ttl: number, clockValue: clock.Clock): BatchedExitRuleAssignmentStore {
  return new CachedBatchedExitRuleAssignmentStore(
    inner,
    cache.newTtlCache<BatchedExitRuleAssignment>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched exit rule assignments. Empty fields match all. */
export class BatchedExitRuleAssignmentQuery {
  channel: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minBudget: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedExitRuleAssignment): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedExitRuleAssignment[]): BatchedExitRuleAssignment[] {
    const matched = collections.filter(items, (candidate: BatchedExitRuleAssignment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedExitRuleAssignments(store: BatchedExitRuleAssignmentStore, query: BatchedExitRuleAssignmentQuery): BatchedExitRuleAssignment[] {
  return query.apply(store.list());
}
