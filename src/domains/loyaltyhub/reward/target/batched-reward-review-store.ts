import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedRewardReview } from "./batched-reward-review.js";

/** Keeps batched reward reviews by code. */
export interface BatchedRewardReviewStore {
  find(code: string): BatchedRewardReview | undefined;
  save(item: BatchedRewardReview): void;
  remove(code: string): boolean;
  list(): BatchedRewardReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedRewardReviewStore implements BatchedRewardReviewStore {
  items: Map<string, BatchedRewardReview>;
  order: string[];

  constructor(items: Map<string, BatchedRewardReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedRewardReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedRewardReview): void {
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

  list(): BatchedRewardReview[] {
    const out: BatchedRewardReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedRewardReviewStore(): BatchedRewardReviewStore {
  return new MemoryBatchedRewardReviewStore(new Map<string, BatchedRewardReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedRewardReviewStore implements BatchedRewardReviewStore {
  inner: BatchedRewardReviewStore;
  cache: cache.TtlCache<BatchedRewardReview>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedRewardReviewStore,
    cacheValue: cache.TtlCache<BatchedRewardReview>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedRewardReview | undefined {
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

  save(item: BatchedRewardReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedRewardReview[] {
    return this.inner.list();
  }
}

export function newCachedBatchedRewardReviewStore(inner: BatchedRewardReviewStore, ttl: number, clockValue: clock.Clock): BatchedRewardReviewStore {
  return new CachedBatchedRewardReviewStore(inner, cache.newTtlCache<BatchedRewardReview>(1024, ttl, clockValue), 0, 0);
}

/** Selects batched reward reviews. Empty fields match all. */
export class BatchedRewardReviewQuery {
  locale: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minMaximum: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedRewardReview): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedRewardReview[]): BatchedRewardReview[] {
    const matched = collections.filter(items, (candidate: BatchedRewardReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedRewardReviews(store: BatchedRewardReviewStore, query: BatchedRewardReviewQuery): BatchedRewardReview[] {
  return query.apply(store.list());
}
