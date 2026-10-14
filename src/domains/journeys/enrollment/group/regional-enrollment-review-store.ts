import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalEnrollmentReview } from "./regional-enrollment-review.js";

/** Keeps regional enrollment reviews by code. */
export interface RegionalEnrollmentReviewStore {
  find(code: string): RegionalEnrollmentReview | undefined;
  save(item: RegionalEnrollmentReview): void;
  remove(code: string): boolean;
  list(): RegionalEnrollmentReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalEnrollmentReviewStore implements RegionalEnrollmentReviewStore {
  items: Map<string, RegionalEnrollmentReview>;
  order: string[];

  constructor(items: Map<string, RegionalEnrollmentReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalEnrollmentReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalEnrollmentReview): void {
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

  list(): RegionalEnrollmentReview[] {
    const out: RegionalEnrollmentReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalEnrollmentReviewStore(): RegionalEnrollmentReviewStore {
  return new MemoryRegionalEnrollmentReviewStore(new Map<string, RegionalEnrollmentReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalEnrollmentReviewStore implements RegionalEnrollmentReviewStore {
  inner: RegionalEnrollmentReviewStore;
  cache: cache.TtlCache<RegionalEnrollmentReview>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalEnrollmentReviewStore,
    cacheValue: cache.TtlCache<RegionalEnrollmentReview>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalEnrollmentReview | undefined {
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

  save(item: RegionalEnrollmentReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalEnrollmentReview[] {
    return this.inner.list();
  }
}

export function newCachedRegionalEnrollmentReviewStore(inner: RegionalEnrollmentReviewStore, ttl: number, clockValue: clock.Clock): RegionalEnrollmentReviewStore {
  return new CachedRegionalEnrollmentReviewStore(
    inner,
    cache.newTtlCache<RegionalEnrollmentReview>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional enrollment reviews. Empty fields match all. */
export class RegionalEnrollmentReviewQuery {
  unit: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minMinimum: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalEnrollmentReview): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalEnrollmentReview[]): RegionalEnrollmentReview[] {
    const matched = collections.filter(items, (candidate: RegionalEnrollmentReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalEnrollmentReviews(store: RegionalEnrollmentReviewStore, query: RegionalEnrollmentReviewQuery): RegionalEnrollmentReview[] {
  return query.apply(store.list());
}
