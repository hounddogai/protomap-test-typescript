import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryBounceReview } from "./primary-bounce-review.js";

/** Keeps primary bounce reviews by code. */
export interface PrimaryBounceReviewStore {
  find(code: string): PrimaryBounceReview | undefined;
  save(item: PrimaryBounceReview): void;
  remove(code: string): boolean;
  list(): PrimaryBounceReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryBounceReviewStore implements PrimaryBounceReviewStore {
  items: Map<string, PrimaryBounceReview>;
  order: string[];

  constructor(items: Map<string, PrimaryBounceReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryBounceReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryBounceReview): void {
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

  list(): PrimaryBounceReview[] {
    const out: PrimaryBounceReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryBounceReviewStore(): PrimaryBounceReviewStore {
  return new MemoryPrimaryBounceReviewStore(new Map<string, PrimaryBounceReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryBounceReviewStore implements PrimaryBounceReviewStore {
  inner: PrimaryBounceReviewStore;
  cache: cache.TtlCache<PrimaryBounceReview>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryBounceReviewStore,
    cacheValue: cache.TtlCache<PrimaryBounceReview>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryBounceReview | undefined {
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

  save(item: PrimaryBounceReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryBounceReview[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryBounceReviewStore(inner: PrimaryBounceReviewStore, ttl: number, clockValue: clock.Clock): PrimaryBounceReviewStore {
  return new CachedPrimaryBounceReviewStore(inner, cache.newTtlCache<PrimaryBounceReview>(512, ttl, clockValue), 0, 0);
}

/** Selects primary bounce reviews. Empty fields match all. */
export class PrimaryBounceReviewQuery {
  category: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minCeiling: number, statuses: string[], limit: number) {
    this.category = category;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryBounceReview): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryBounceReview[]): PrimaryBounceReview[] {
    const matched = collections.filter(items, (candidate: PrimaryBounceReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryBounceReviews(store: PrimaryBounceReviewStore, query: PrimaryBounceReviewQuery): PrimaryBounceReview[] {
  return query.apply(store.list());
}
