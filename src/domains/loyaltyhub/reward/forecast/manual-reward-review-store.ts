import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualRewardReview } from "./manual-reward-review.js";

/** Keeps manual reward reviews by code. */
export interface ManualRewardReviewStore {
  find(code: string): ManualRewardReview | undefined;
  save(item: ManualRewardReview): void;
  remove(code: string): boolean;
  list(): ManualRewardReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualRewardReviewStore implements ManualRewardReviewStore {
  items: Map<string, ManualRewardReview>;
  order: string[];

  constructor(items: Map<string, ManualRewardReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualRewardReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualRewardReview): void {
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

  list(): ManualRewardReview[] {
    const out: ManualRewardReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualRewardReviewStore(): ManualRewardReviewStore {
  return new MemoryManualRewardReviewStore(new Map<string, ManualRewardReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualRewardReviewStore implements ManualRewardReviewStore {
  inner: ManualRewardReviewStore;
  cache: cache.TtlCache<ManualRewardReview>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualRewardReviewStore,
    cacheValue: cache.TtlCache<ManualRewardReview>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualRewardReview | undefined {
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

  save(item: ManualRewardReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualRewardReview[] {
    return this.inner.list();
  }
}

export function newCachedManualRewardReviewStore(inner: ManualRewardReviewStore, ttl: number, clockValue: clock.Clock): ManualRewardReviewStore {
  return new CachedManualRewardReviewStore(inner, cache.newTtlCache<ManualRewardReview>(1024, ttl, clockValue), 0, 0);
}

/** Selects manual reward reviews. Empty fields match all. */
export class ManualRewardReviewQuery {
  locale: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minCost: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualRewardReview): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualRewardReview[]): ManualRewardReview[] {
    const matched = collections.filter(items, (candidate: ManualRewardReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualRewardReviews(store: ManualRewardReviewStore, query: ManualRewardReviewQuery): ManualRewardReview[] {
  return query.apply(store.list());
}
