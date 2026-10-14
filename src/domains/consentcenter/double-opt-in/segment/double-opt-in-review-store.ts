import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DoubleOptInReview } from "./double-opt-in-review.js";

/** Keeps double opt in reviews by code. */
export interface DoubleOptInReviewStore {
  find(code: string): DoubleOptInReview | undefined;
  save(item: DoubleOptInReview): void;
  remove(code: string): boolean;
  list(): DoubleOptInReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDoubleOptInReviewStore implements DoubleOptInReviewStore {
  items: Map<string, DoubleOptInReview>;
  order: string[];

  constructor(items: Map<string, DoubleOptInReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DoubleOptInReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DoubleOptInReview): void {
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

  list(): DoubleOptInReview[] {
    const out: DoubleOptInReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDoubleOptInReviewStore(): DoubleOptInReviewStore {
  return new MemoryDoubleOptInReviewStore(new Map<string, DoubleOptInReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDoubleOptInReviewStore implements DoubleOptInReviewStore {
  inner: DoubleOptInReviewStore;
  cache: cache.TtlCache<DoubleOptInReview>;
  hits: number;
  misses: number;

  constructor(
    inner: DoubleOptInReviewStore,
    cacheValue: cache.TtlCache<DoubleOptInReview>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DoubleOptInReview | undefined {
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

  save(item: DoubleOptInReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DoubleOptInReview[] {
    return this.inner.list();
  }
}

export function newCachedDoubleOptInReviewStore(inner: DoubleOptInReviewStore, ttl: number, clockValue: clock.Clock): DoubleOptInReviewStore {
  return new CachedDoubleOptInReviewStore(inner, cache.newTtlCache<DoubleOptInReview>(256, ttl, clockValue), 0, 0);
}

/** Selects double opt in reviews. Empty fields match all. */
export class DoubleOptInReviewQuery {
  unit: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minAmount: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DoubleOptInReview): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DoubleOptInReview[]): DoubleOptInReview[] {
    const matched = collections.filter(items, (candidate: DoubleOptInReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDoubleOptInReviews(store: DoubleOptInReviewStore, query: DoubleOptInReviewQuery): DoubleOptInReview[] {
  return query.apply(store.list());
}
