import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedMentionReview } from "./batched-mention-review.js";

/** Keeps batched mention reviews by code. */
export interface BatchedMentionReviewStore {
  find(code: string): BatchedMentionReview | undefined;
  save(item: BatchedMentionReview): void;
  remove(code: string): boolean;
  list(): BatchedMentionReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedMentionReviewStore implements BatchedMentionReviewStore {
  items: Map<string, BatchedMentionReview>;
  order: string[];

  constructor(items: Map<string, BatchedMentionReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedMentionReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedMentionReview): void {
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

  list(): BatchedMentionReview[] {
    const out: BatchedMentionReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedMentionReviewStore(): BatchedMentionReviewStore {
  return new MemoryBatchedMentionReviewStore(new Map<string, BatchedMentionReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedMentionReviewStore implements BatchedMentionReviewStore {
  inner: BatchedMentionReviewStore;
  cache: cache.TtlCache<BatchedMentionReview>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedMentionReviewStore,
    cacheValue: cache.TtlCache<BatchedMentionReview>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedMentionReview | undefined {
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

  save(item: BatchedMentionReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedMentionReview[] {
    return this.inner.list();
  }
}

export function newCachedBatchedMentionReviewStore(inner: BatchedMentionReviewStore, ttl: number, clockValue: clock.Clock): BatchedMentionReviewStore {
  return new CachedBatchedMentionReviewStore(
    inner,
    cache.newTtlCache<BatchedMentionReview>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched mention reviews. Empty fields match all. */
export class BatchedMentionReviewQuery {
  source: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.source = source;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedMentionReview): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedMentionReview[]): BatchedMentionReview[] {
    const matched = collections.filter(items, (candidate: BatchedMentionReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedMentionReviews(store: BatchedMentionReviewStore, query: BatchedMentionReviewQuery): BatchedMentionReview[] {
  return query.apply(store.list());
}
