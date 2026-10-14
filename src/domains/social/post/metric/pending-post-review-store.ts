import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingPostReview } from "./pending-post-review.js";

/** Keeps pending post reviews by code. */
export interface PendingPostReviewStore {
  find(code: string): PendingPostReview | undefined;
  save(item: PendingPostReview): void;
  remove(code: string): boolean;
  list(): PendingPostReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingPostReviewStore implements PendingPostReviewStore {
  items: Map<string, PendingPostReview>;
  order: string[];

  constructor(items: Map<string, PendingPostReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingPostReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingPostReview): void {
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

  list(): PendingPostReview[] {
    const out: PendingPostReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingPostReviewStore(): PendingPostReviewStore {
  return new MemoryPendingPostReviewStore(new Map<string, PendingPostReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingPostReviewStore implements PendingPostReviewStore {
  inner: PendingPostReviewStore;
  cache: cache.TtlCache<PendingPostReview>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingPostReviewStore,
    cacheValue: cache.TtlCache<PendingPostReview>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingPostReview | undefined {
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

  save(item: PendingPostReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingPostReview[] {
    return this.inner.list();
  }
}

export function newCachedPendingPostReviewStore(inner: PendingPostReviewStore, ttl: number, clockValue: clock.Clock): PendingPostReviewStore {
  return new CachedPendingPostReviewStore(inner, cache.newTtlCache<PendingPostReview>(512, ttl, clockValue), 0, 0);
}

/** Selects pending post reviews. Empty fields match all. */
export class PendingPostReviewQuery {
  category: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minLimit: number, statuses: string[], limit: number) {
    this.category = category;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingPostReview): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingPostReview[]): PendingPostReview[] {
    const matched = collections.filter(items, (candidate: PendingPostReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingPostReviews(store: PendingPostReviewStore, query: PendingPostReviewQuery): PendingPostReview[] {
  return query.apply(store.list());
}
