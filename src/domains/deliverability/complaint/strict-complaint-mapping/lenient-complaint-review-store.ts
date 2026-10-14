import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientComplaintReview } from "./lenient-complaint-review.js";

/** Keeps lenient complaint reviews by code. */
export interface LenientComplaintReviewStore {
  find(code: string): LenientComplaintReview | undefined;
  save(item: LenientComplaintReview): void;
  remove(code: string): boolean;
  list(): LenientComplaintReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientComplaintReviewStore implements LenientComplaintReviewStore {
  items: Map<string, LenientComplaintReview>;
  order: string[];

  constructor(items: Map<string, LenientComplaintReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientComplaintReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientComplaintReview): void {
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

  list(): LenientComplaintReview[] {
    const out: LenientComplaintReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientComplaintReviewStore(): LenientComplaintReviewStore {
  return new MemoryLenientComplaintReviewStore(new Map<string, LenientComplaintReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientComplaintReviewStore implements LenientComplaintReviewStore {
  inner: LenientComplaintReviewStore;
  cache: cache.TtlCache<LenientComplaintReview>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientComplaintReviewStore,
    cacheValue: cache.TtlCache<LenientComplaintReview>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientComplaintReview | undefined {
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

  save(item: LenientComplaintReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientComplaintReview[] {
    return this.inner.list();
  }
}

export function newCachedLenientComplaintReviewStore(inner: LenientComplaintReviewStore, ttl: number, clockValue: clock.Clock): LenientComplaintReviewStore {
  return new CachedLenientComplaintReviewStore(
    inner,
    cache.newTtlCache<LenientComplaintReview>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient complaint reviews. Empty fields match all. */
export class LenientComplaintReviewQuery {
  locale: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minEndsAt: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientComplaintReview): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientComplaintReview[]): LenientComplaintReview[] {
    const matched = collections.filter(items, (candidate: LenientComplaintReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientComplaintReviews(store: LenientComplaintReviewStore, query: LenientComplaintReviewQuery): LenientComplaintReview[] {
  return query.apply(store.list());
}
