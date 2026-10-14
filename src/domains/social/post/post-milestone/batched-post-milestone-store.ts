import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedPostMilestone } from "./batched-post-milestone.js";

/** Keeps batched post milestones by code. */
export interface BatchedPostMilestoneStore {
  find(code: string): BatchedPostMilestone | undefined;
  save(item: BatchedPostMilestone): void;
  remove(code: string): boolean;
  list(): BatchedPostMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedPostMilestoneStore implements BatchedPostMilestoneStore {
  items: Map<string, BatchedPostMilestone>;
  order: string[];

  constructor(items: Map<string, BatchedPostMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedPostMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedPostMilestone): void {
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

  list(): BatchedPostMilestone[] {
    const out: BatchedPostMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedPostMilestoneStore(): BatchedPostMilestoneStore {
  return new MemoryBatchedPostMilestoneStore(new Map<string, BatchedPostMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedPostMilestoneStore implements BatchedPostMilestoneStore {
  inner: BatchedPostMilestoneStore;
  cache: cache.TtlCache<BatchedPostMilestone>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedPostMilestoneStore,
    cacheValue: cache.TtlCache<BatchedPostMilestone>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedPostMilestone | undefined {
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

  save(item: BatchedPostMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedPostMilestone[] {
    return this.inner.list();
  }
}

export function newCachedBatchedPostMilestoneStore(inner: BatchedPostMilestoneStore, ttl: number, clockValue: clock.Clock): BatchedPostMilestoneStore {
  return new CachedBatchedPostMilestoneStore(
    inner,
    cache.newTtlCache<BatchedPostMilestone>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched post milestones. Empty fields match all. */
export class BatchedPostMilestoneQuery {
  name: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minQuantity: number, statuses: string[], limit: number) {
    this.name = name;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedPostMilestone): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedPostMilestone[]): BatchedPostMilestone[] {
    const matched = collections.filter(items, (candidate: BatchedPostMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedPostMilestones(store: BatchedPostMilestoneStore, query: BatchedPostMilestoneQuery): BatchedPostMilestone[] {
  return query.apply(store.list());
}
