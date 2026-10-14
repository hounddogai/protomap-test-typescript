import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SuppressionReview } from "./suppression-review.js";

/** Keeps suppression reviews by code. */
export interface SuppressionReviewStore {
  find(code: string): SuppressionReview | undefined;
  save(item: SuppressionReview): void;
  remove(code: string): boolean;
  list(): SuppressionReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySuppressionReviewStore implements SuppressionReviewStore {
  items: Map<string, SuppressionReview>;
  order: string[];

  constructor(items: Map<string, SuppressionReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SuppressionReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SuppressionReview): void {
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

  list(): SuppressionReview[] {
    const out: SuppressionReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySuppressionReviewStore(): SuppressionReviewStore {
  return new MemorySuppressionReviewStore(new Map<string, SuppressionReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSuppressionReviewStore implements SuppressionReviewStore {
  inner: SuppressionReviewStore;
  cache: cache.TtlCache<SuppressionReview>;
  hits: number;
  misses: number;

  constructor(
    inner: SuppressionReviewStore,
    cacheValue: cache.TtlCache<SuppressionReview>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SuppressionReview | undefined {
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

  save(item: SuppressionReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SuppressionReview[] {
    return this.inner.list();
  }
}

export function newCachedSuppressionReviewStore(inner: SuppressionReviewStore, ttl: number, clockValue: clock.Clock): SuppressionReviewStore {
  return new CachedSuppressionReviewStore(inner, cache.newTtlCache<SuppressionReview>(1024, ttl, clockValue), 0, 0);
}

/** Selects suppression reviews. Empty fields match all. */
export class SuppressionReviewQuery {
  region: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minMargin: number, statuses: string[], limit: number) {
    this.region = region;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SuppressionReview): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SuppressionReview[]): SuppressionReview[] {
    const matched = collections.filter(items, (candidate: SuppressionReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSuppressionReviews(store: SuppressionReviewStore, query: SuppressionReviewQuery): SuppressionReview[] {
  return query.apply(store.list());
}
