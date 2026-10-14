import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedEnrollmentReview } from "./capped-enrollment-review.js";

/** Keeps capped enrollment reviews by code. */
export interface CappedEnrollmentReviewStore {
  find(code: string): CappedEnrollmentReview | undefined;
  save(item: CappedEnrollmentReview): void;
  remove(code: string): boolean;
  list(): CappedEnrollmentReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedEnrollmentReviewStore implements CappedEnrollmentReviewStore {
  items: Map<string, CappedEnrollmentReview>;
  order: string[];

  constructor(items: Map<string, CappedEnrollmentReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedEnrollmentReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedEnrollmentReview): void {
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

  list(): CappedEnrollmentReview[] {
    const out: CappedEnrollmentReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedEnrollmentReviewStore(): CappedEnrollmentReviewStore {
  return new MemoryCappedEnrollmentReviewStore(new Map<string, CappedEnrollmentReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedEnrollmentReviewStore implements CappedEnrollmentReviewStore {
  inner: CappedEnrollmentReviewStore;
  cache: cache.TtlCache<CappedEnrollmentReview>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedEnrollmentReviewStore,
    cacheValue: cache.TtlCache<CappedEnrollmentReview>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedEnrollmentReview | undefined {
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

  save(item: CappedEnrollmentReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedEnrollmentReview[] {
    return this.inner.list();
  }
}

export function newCachedCappedEnrollmentReviewStore(inner: CappedEnrollmentReviewStore, ttl: number, clockValue: clock.Clock): CappedEnrollmentReviewStore {
  return new CachedCappedEnrollmentReviewStore(
    inner,
    cache.newTtlCache<CappedEnrollmentReview>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects capped enrollment reviews. Empty fields match all. */
export class CappedEnrollmentReviewQuery {
  title: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minMaximum: number, statuses: string[], limit: number) {
    this.title = title;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedEnrollmentReview): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedEnrollmentReview[]): CappedEnrollmentReview[] {
    const matched = collections.filter(items, (candidate: CappedEnrollmentReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedEnrollmentReviews(store: CappedEnrollmentReviewStore, query: CappedEnrollmentReviewQuery): CappedEnrollmentReview[] {
  return query.apply(store.list());
}
