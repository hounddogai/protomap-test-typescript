import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedTierMilestone } from "./batched-tier-milestone.js";

/** Keeps batched tier milestones by code. */
export interface BatchedTierMilestoneStore {
  find(code: string): BatchedTierMilestone | undefined;
  save(item: BatchedTierMilestone): void;
  remove(code: string): boolean;
  list(): BatchedTierMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedTierMilestoneStore implements BatchedTierMilestoneStore {
  items: Map<string, BatchedTierMilestone>;
  order: string[];

  constructor(items: Map<string, BatchedTierMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedTierMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedTierMilestone): void {
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

  list(): BatchedTierMilestone[] {
    const out: BatchedTierMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedTierMilestoneStore(): BatchedTierMilestoneStore {
  return new MemoryBatchedTierMilestoneStore(new Map<string, BatchedTierMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedTierMilestoneStore implements BatchedTierMilestoneStore {
  inner: BatchedTierMilestoneStore;
  cache: cache.TtlCache<BatchedTierMilestone>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedTierMilestoneStore,
    cacheValue: cache.TtlCache<BatchedTierMilestone>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedTierMilestone | undefined {
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

  save(item: BatchedTierMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedTierMilestone[] {
    return this.inner.list();
  }
}

export function newCachedBatchedTierMilestoneStore(inner: BatchedTierMilestoneStore, ttl: number, clockValue: clock.Clock): BatchedTierMilestoneStore {
  return new CachedBatchedTierMilestoneStore(
    inner,
    cache.newTtlCache<BatchedTierMilestone>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched tier milestones. Empty fields match all. */
export class BatchedTierMilestoneQuery {
  title: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedTierMilestone): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedTierMilestone[]): BatchedTierMilestone[] {
    const matched = collections.filter(items, (candidate: BatchedTierMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedTierMilestones(store: BatchedTierMilestoneStore, query: BatchedTierMilestoneQuery): BatchedTierMilestone[] {
  return query.apply(store.list());
}
