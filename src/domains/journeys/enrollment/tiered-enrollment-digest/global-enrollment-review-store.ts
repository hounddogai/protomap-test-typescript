import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalEnrollmentReview } from "./global-enrollment-review.js";

/** Keeps global enrollment reviews by code. */
export interface GlobalEnrollmentReviewStore {
  find(code: string): GlobalEnrollmentReview | undefined;
  save(item: GlobalEnrollmentReview): void;
  remove(code: string): boolean;
  list(): GlobalEnrollmentReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalEnrollmentReviewStore implements GlobalEnrollmentReviewStore {
  items: Map<string, GlobalEnrollmentReview>;
  order: string[];

  constructor(items: Map<string, GlobalEnrollmentReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalEnrollmentReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalEnrollmentReview): void {
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

  list(): GlobalEnrollmentReview[] {
    const out: GlobalEnrollmentReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalEnrollmentReviewStore(): GlobalEnrollmentReviewStore {
  return new MemoryGlobalEnrollmentReviewStore(new Map<string, GlobalEnrollmentReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalEnrollmentReviewStore implements GlobalEnrollmentReviewStore {
  inner: GlobalEnrollmentReviewStore;
  cache: cache.TtlCache<GlobalEnrollmentReview>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalEnrollmentReviewStore,
    cacheValue: cache.TtlCache<GlobalEnrollmentReview>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalEnrollmentReview | undefined {
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

  save(item: GlobalEnrollmentReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalEnrollmentReview[] {
    return this.inner.list();
  }
}

export function newCachedGlobalEnrollmentReviewStore(inner: GlobalEnrollmentReviewStore, ttl: number, clockValue: clock.Clock): GlobalEnrollmentReviewStore {
  return new CachedGlobalEnrollmentReviewStore(
    inner,
    cache.newTtlCache<GlobalEnrollmentReview>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects global enrollment reviews. Empty fields match all. */
export class GlobalEnrollmentReviewQuery {
  source: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.source = source;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalEnrollmentReview): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalEnrollmentReview[]): GlobalEnrollmentReview[] {
    const matched = collections.filter(items, (candidate: GlobalEnrollmentReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalEnrollmentReviews(store: GlobalEnrollmentReviewStore, query: GlobalEnrollmentReviewQuery): GlobalEnrollmentReview[] {
  return query.apply(store.list());
}
