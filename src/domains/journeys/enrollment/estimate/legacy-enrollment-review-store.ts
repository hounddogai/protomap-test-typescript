import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyEnrollmentReview } from "./legacy-enrollment-review.js";

/** Keeps legacy enrollment reviews by code. */
export interface LegacyEnrollmentReviewStore {
  find(code: string): LegacyEnrollmentReview | undefined;
  save(item: LegacyEnrollmentReview): void;
  remove(code: string): boolean;
  list(): LegacyEnrollmentReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyEnrollmentReviewStore implements LegacyEnrollmentReviewStore {
  items: Map<string, LegacyEnrollmentReview>;
  order: string[];

  constructor(items: Map<string, LegacyEnrollmentReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyEnrollmentReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyEnrollmentReview): void {
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

  list(): LegacyEnrollmentReview[] {
    const out: LegacyEnrollmentReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyEnrollmentReviewStore(): LegacyEnrollmentReviewStore {
  return new MemoryLegacyEnrollmentReviewStore(new Map<string, LegacyEnrollmentReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyEnrollmentReviewStore implements LegacyEnrollmentReviewStore {
  inner: LegacyEnrollmentReviewStore;
  cache: cache.TtlCache<LegacyEnrollmentReview>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyEnrollmentReviewStore,
    cacheValue: cache.TtlCache<LegacyEnrollmentReview>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyEnrollmentReview | undefined {
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

  save(item: LegacyEnrollmentReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyEnrollmentReview[] {
    return this.inner.list();
  }
}

export function newCachedLegacyEnrollmentReviewStore(inner: LegacyEnrollmentReviewStore, ttl: number, clockValue: clock.Clock): LegacyEnrollmentReviewStore {
  return new CachedLegacyEnrollmentReviewStore(
    inner,
    cache.newTtlCache<LegacyEnrollmentReview>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy enrollment reviews. Empty fields match all. */
export class LegacyEnrollmentReviewQuery {
  label: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minImpressions: number, statuses: string[], limit: number) {
    this.label = label;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyEnrollmentReview): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyEnrollmentReview[]): LegacyEnrollmentReview[] {
    const matched = collections.filter(items, (candidate: LegacyEnrollmentReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyEnrollmentReviews(store: LegacyEnrollmentReviewStore, query: LegacyEnrollmentReviewQuery): LegacyEnrollmentReview[] {
  return query.apply(store.list());
}
