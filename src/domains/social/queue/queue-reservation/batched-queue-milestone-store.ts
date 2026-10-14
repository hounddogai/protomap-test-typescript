import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedQueueMilestone } from "./batched-queue-milestone.js";

/** Keeps batched queue milestones by code. */
export interface BatchedQueueMilestoneStore {
  find(code: string): BatchedQueueMilestone | undefined;
  save(item: BatchedQueueMilestone): void;
  remove(code: string): boolean;
  list(): BatchedQueueMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedQueueMilestoneStore implements BatchedQueueMilestoneStore {
  items: Map<string, BatchedQueueMilestone>;
  order: string[];

  constructor(items: Map<string, BatchedQueueMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedQueueMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedQueueMilestone): void {
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

  list(): BatchedQueueMilestone[] {
    const out: BatchedQueueMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedQueueMilestoneStore(): BatchedQueueMilestoneStore {
  return new MemoryBatchedQueueMilestoneStore(new Map<string, BatchedQueueMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedQueueMilestoneStore implements BatchedQueueMilestoneStore {
  inner: BatchedQueueMilestoneStore;
  cache: cache.TtlCache<BatchedQueueMilestone>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedQueueMilestoneStore,
    cacheValue: cache.TtlCache<BatchedQueueMilestone>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedQueueMilestone | undefined {
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

  save(item: BatchedQueueMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedQueueMilestone[] {
    return this.inner.list();
  }
}

export function newCachedBatchedQueueMilestoneStore(inner: BatchedQueueMilestoneStore, ttl: number, clockValue: clock.Clock): BatchedQueueMilestoneStore {
  return new CachedBatchedQueueMilestoneStore(
    inner,
    cache.newTtlCache<BatchedQueueMilestone>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched queue milestones. Empty fields match all. */
export class BatchedQueueMilestoneQuery {
  locale: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minScore: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedQueueMilestone): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedQueueMilestone[]): BatchedQueueMilestone[] {
    const matched = collections.filter(items, (candidate: BatchedQueueMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedQueueMilestones(store: BatchedQueueMilestoneStore, query: BatchedQueueMilestoneQuery): BatchedQueueMilestone[] {
  return query.apply(store.list());
}
