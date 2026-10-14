import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CohortReview } from "./cohort-review.js";

/** Keeps cohort reviews by code. */
export interface CohortReviewStore {
  find(code: string): CohortReview | undefined;
  save(item: CohortReview): void;
  remove(code: string): boolean;
  list(): CohortReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCohortReviewStore implements CohortReviewStore {
  items: Map<string, CohortReview>;
  order: string[];

  constructor(items: Map<string, CohortReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CohortReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CohortReview): void {
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

  list(): CohortReview[] {
    const out: CohortReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCohortReviewStore(): CohortReviewStore {
  return new MemoryCohortReviewStore(new Map<string, CohortReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCohortReviewStore implements CohortReviewStore {
  inner: CohortReviewStore;
  cache: cache.TtlCache<CohortReview>;
  hits: number;
  misses: number;

  constructor(inner: CohortReviewStore, cacheValue: cache.TtlCache<CohortReview>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CohortReview | undefined {
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

  save(item: CohortReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CohortReview[] {
    return this.inner.list();
  }
}

export function newCachedCohortReviewStore(inner: CohortReviewStore, ttl: number, clockValue: clock.Clock): CohortReviewStore {
  return new CachedCohortReviewStore(inner, cache.newTtlCache<CohortReview>(512, ttl, clockValue), 0, 0);
}

/** Selects cohort reviews. Empty fields match all. */
export class CohortReviewQuery {
  utmSource: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minRevision: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CohortReview): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CohortReview[]): CohortReview[] {
    const matched = collections.filter(items, (candidate: CohortReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCohortReviews(store: CohortReviewStore, query: CohortReviewQuery): CohortReview[] {
  return query.apply(store.list());
}
