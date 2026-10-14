import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { EnrollmentReview } from "./enrollment-review.js";

/** Keeps enrollment reviews by code. */
export interface EnrollmentReviewStore {
  find(code: string): EnrollmentReview | undefined;
  save(item: EnrollmentReview): void;
  remove(code: string): boolean;
  list(): EnrollmentReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryEnrollmentReviewStore implements EnrollmentReviewStore {
  items: Map<string, EnrollmentReview>;
  order: string[];

  constructor(items: Map<string, EnrollmentReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): EnrollmentReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: EnrollmentReview): void {
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

  list(): EnrollmentReview[] {
    const out: EnrollmentReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryEnrollmentReviewStore(): EnrollmentReviewStore {
  return new MemoryEnrollmentReviewStore(new Map<string, EnrollmentReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedEnrollmentReviewStore implements EnrollmentReviewStore {
  inner: EnrollmentReviewStore;
  cache: cache.TtlCache<EnrollmentReview>;
  hits: number;
  misses: number;

  constructor(
    inner: EnrollmentReviewStore,
    cacheValue: cache.TtlCache<EnrollmentReview>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): EnrollmentReview | undefined {
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

  save(item: EnrollmentReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): EnrollmentReview[] {
    return this.inner.list();
  }
}

export function newCachedEnrollmentReviewStore(inner: EnrollmentReviewStore, ttl: number, clockValue: clock.Clock): EnrollmentReviewStore {
  return new CachedEnrollmentReviewStore(inner, cache.newTtlCache<EnrollmentReview>(256, ttl, clockValue), 0, 0);
}

/** Selects enrollment reviews. Empty fields match all. */
export class EnrollmentReviewQuery {
  locale: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minGraceDays: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: EnrollmentReview): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: EnrollmentReview[]): EnrollmentReview[] {
    const matched = collections.filter(items, (candidate: EnrollmentReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findEnrollmentReviews(store: EnrollmentReviewStore, query: EnrollmentReviewQuery): EnrollmentReview[] {
  return query.apply(store.list());
}
