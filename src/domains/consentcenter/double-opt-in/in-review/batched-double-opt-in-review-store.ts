import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedDoubleOptInReview } from "./batched-double-opt-in-review.js";

/** Keeps batched double opt in reviews by code. */
export interface BatchedDoubleOptInReviewStore {
  find(code: string): BatchedDoubleOptInReview | undefined;
  save(item: BatchedDoubleOptInReview): void;
  remove(code: string): boolean;
  list(): BatchedDoubleOptInReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedDoubleOptInReviewStore implements BatchedDoubleOptInReviewStore {
  items: Map<string, BatchedDoubleOptInReview>;
  order: string[];

  constructor(items: Map<string, BatchedDoubleOptInReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedDoubleOptInReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedDoubleOptInReview): void {
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

  list(): BatchedDoubleOptInReview[] {
    const out: BatchedDoubleOptInReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedDoubleOptInReviewStore(): BatchedDoubleOptInReviewStore {
  return new MemoryBatchedDoubleOptInReviewStore(new Map<string, BatchedDoubleOptInReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedDoubleOptInReviewStore implements BatchedDoubleOptInReviewStore {
  inner: BatchedDoubleOptInReviewStore;
  cache: cache.TtlCache<BatchedDoubleOptInReview>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedDoubleOptInReviewStore,
    cacheValue: cache.TtlCache<BatchedDoubleOptInReview>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedDoubleOptInReview | undefined {
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

  save(item: BatchedDoubleOptInReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedDoubleOptInReview[] {
    return this.inner.list();
  }
}

export function newCachedBatchedDoubleOptInReviewStore(inner: BatchedDoubleOptInReviewStore, ttl: number, clockValue: clock.Clock): BatchedDoubleOptInReviewStore {
  return new CachedBatchedDoubleOptInReviewStore(
    inner,
    cache.newTtlCache<BatchedDoubleOptInReview>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched double opt in reviews. Empty fields match all. */
export class BatchedDoubleOptInReviewQuery {
  locale: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minBatchSize: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedDoubleOptInReview): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedDoubleOptInReview[]): BatchedDoubleOptInReview[] {
    const matched = collections.filter(items, (candidate: BatchedDoubleOptInReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedDoubleOptInReviews(store: BatchedDoubleOptInReviewStore, query: BatchedDoubleOptInReviewQuery): BatchedDoubleOptInReview[] {
  return query.apply(store.list());
}
