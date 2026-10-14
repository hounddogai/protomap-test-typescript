import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedMentionMilestone } from "./batched-mention-milestone.js";

/** Keeps batched mention milestones by code. */
export interface BatchedMentionMilestoneStore {
  find(code: string): BatchedMentionMilestone | undefined;
  save(item: BatchedMentionMilestone): void;
  remove(code: string): boolean;
  list(): BatchedMentionMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedMentionMilestoneStore implements BatchedMentionMilestoneStore {
  items: Map<string, BatchedMentionMilestone>;
  order: string[];

  constructor(items: Map<string, BatchedMentionMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedMentionMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedMentionMilestone): void {
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

  list(): BatchedMentionMilestone[] {
    const out: BatchedMentionMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedMentionMilestoneStore(): BatchedMentionMilestoneStore {
  return new MemoryBatchedMentionMilestoneStore(new Map<string, BatchedMentionMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedMentionMilestoneStore implements BatchedMentionMilestoneStore {
  inner: BatchedMentionMilestoneStore;
  cache: cache.TtlCache<BatchedMentionMilestone>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedMentionMilestoneStore,
    cacheValue: cache.TtlCache<BatchedMentionMilestone>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedMentionMilestone | undefined {
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

  save(item: BatchedMentionMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedMentionMilestone[] {
    return this.inner.list();
  }
}

export function newCachedBatchedMentionMilestoneStore(inner: BatchedMentionMilestoneStore, ttl: number, clockValue: clock.Clock): BatchedMentionMilestoneStore {
  return new CachedBatchedMentionMilestoneStore(
    inner,
    cache.newTtlCache<BatchedMentionMilestone>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched mention milestones. Empty fields match all. */
export class BatchedMentionMilestoneQuery {
  country: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minAttempts: number, statuses: string[], limit: number) {
    this.country = country;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedMentionMilestone): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedMentionMilestone[]): BatchedMentionMilestone[] {
    const matched = collections.filter(items, (candidate: BatchedMentionMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedMentionMilestones(store: BatchedMentionMilestoneStore, query: BatchedMentionMilestoneQuery): BatchedMentionMilestone[] {
  return query.apply(store.list());
}
