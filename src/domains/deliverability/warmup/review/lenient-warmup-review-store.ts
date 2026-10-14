import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientWarmupReview } from "./lenient-warmup-review.js";

/** Keeps lenient warmup reviews by code. */
export interface LenientWarmupReviewStore {
  find(code: string): LenientWarmupReview | undefined;
  save(item: LenientWarmupReview): void;
  remove(code: string): boolean;
  list(): LenientWarmupReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientWarmupReviewStore implements LenientWarmupReviewStore {
  items: Map<string, LenientWarmupReview>;
  order: string[];

  constructor(items: Map<string, LenientWarmupReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientWarmupReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientWarmupReview): void {
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

  list(): LenientWarmupReview[] {
    const out: LenientWarmupReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientWarmupReviewStore(): LenientWarmupReviewStore {
  return new MemoryLenientWarmupReviewStore(new Map<string, LenientWarmupReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientWarmupReviewStore implements LenientWarmupReviewStore {
  inner: LenientWarmupReviewStore;
  cache: cache.TtlCache<LenientWarmupReview>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientWarmupReviewStore,
    cacheValue: cache.TtlCache<LenientWarmupReview>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientWarmupReview | undefined {
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

  save(item: LenientWarmupReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientWarmupReview[] {
    return this.inner.list();
  }
}

export function newCachedLenientWarmupReviewStore(inner: LenientWarmupReviewStore, ttl: number, clockValue: clock.Clock): LenientWarmupReviewStore {
  return new CachedLenientWarmupReviewStore(inner, cache.newTtlCache<LenientWarmupReview>(128, ttl, clockValue), 0, 0);
}

/** Selects lenient warmup reviews. Empty fields match all. */
export class LenientWarmupReviewQuery {
  locale: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minAmount: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientWarmupReview): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientWarmupReview[]): LenientWarmupReview[] {
    const matched = collections.filter(items, (candidate: LenientWarmupReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientWarmupReviews(store: LenientWarmupReviewStore, query: LenientWarmupReviewQuery): LenientWarmupReview[] {
  return query.apply(store.list());
}
