import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictFrequencyReview } from "./strict-frequency-review.js";

/** Keeps strict frequency reviews by code. */
export interface StrictFrequencyReviewStore {
  find(code: string): StrictFrequencyReview | undefined;
  save(item: StrictFrequencyReview): void;
  remove(code: string): boolean;
  list(): StrictFrequencyReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictFrequencyReviewStore implements StrictFrequencyReviewStore {
  items: Map<string, StrictFrequencyReview>;
  order: string[];

  constructor(items: Map<string, StrictFrequencyReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictFrequencyReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictFrequencyReview): void {
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

  list(): StrictFrequencyReview[] {
    const out: StrictFrequencyReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictFrequencyReviewStore(): StrictFrequencyReviewStore {
  return new MemoryStrictFrequencyReviewStore(new Map<string, StrictFrequencyReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictFrequencyReviewStore implements StrictFrequencyReviewStore {
  inner: StrictFrequencyReviewStore;
  cache: cache.TtlCache<StrictFrequencyReview>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictFrequencyReviewStore,
    cacheValue: cache.TtlCache<StrictFrequencyReview>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictFrequencyReview | undefined {
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

  save(item: StrictFrequencyReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictFrequencyReview[] {
    return this.inner.list();
  }
}

export function newCachedStrictFrequencyReviewStore(inner: StrictFrequencyReviewStore, ttl: number, clockValue: clock.Clock): StrictFrequencyReviewStore {
  return new CachedStrictFrequencyReviewStore(
    inner,
    cache.newTtlCache<StrictFrequencyReview>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects strict frequency reviews. Empty fields match all. */
export class StrictFrequencyReviewQuery {
  title: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictFrequencyReview): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictFrequencyReview[]): StrictFrequencyReview[] {
    const matched = collections.filter(items, (candidate: StrictFrequencyReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictFrequencyReviews(store: StrictFrequencyReviewStore, query: StrictFrequencyReviewQuery): StrictFrequencyReview[] {
  return query.apply(store.list());
}
