import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveSubscriptionReview } from "./adaptive-subscription-review.js";

/** Keeps adaptive subscription reviews by code. */
export interface AdaptiveSubscriptionReviewStore {
  find(code: string): AdaptiveSubscriptionReview | undefined;
  save(item: AdaptiveSubscriptionReview): void;
  remove(code: string): boolean;
  list(): AdaptiveSubscriptionReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveSubscriptionReviewStore implements AdaptiveSubscriptionReviewStore {
  items: Map<string, AdaptiveSubscriptionReview>;
  order: string[];

  constructor(items: Map<string, AdaptiveSubscriptionReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveSubscriptionReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveSubscriptionReview): void {
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

  list(): AdaptiveSubscriptionReview[] {
    const out: AdaptiveSubscriptionReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveSubscriptionReviewStore(): AdaptiveSubscriptionReviewStore {
  return new MemoryAdaptiveSubscriptionReviewStore(new Map<string, AdaptiveSubscriptionReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveSubscriptionReviewStore implements AdaptiveSubscriptionReviewStore {
  inner: AdaptiveSubscriptionReviewStore;
  cache: cache.TtlCache<AdaptiveSubscriptionReview>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveSubscriptionReviewStore,
    cacheValue: cache.TtlCache<AdaptiveSubscriptionReview>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveSubscriptionReview | undefined {
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

  save(item: AdaptiveSubscriptionReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveSubscriptionReview[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveSubscriptionReviewStore(inner: AdaptiveSubscriptionReviewStore, ttl: number, clockValue: clock.Clock): AdaptiveSubscriptionReviewStore {
  return new CachedAdaptiveSubscriptionReviewStore(
    inner,
    cache.newTtlCache<AdaptiveSubscriptionReview>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive subscription reviews. Empty fields match all. */
export class AdaptiveSubscriptionReviewQuery {
  locale: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minAmount: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveSubscriptionReview): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveSubscriptionReview[]): AdaptiveSubscriptionReview[] {
    const matched = collections.filter(items, (candidate: AdaptiveSubscriptionReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveSubscriptionReviews(store: AdaptiveSubscriptionReviewStore, query: AdaptiveSubscriptionReviewQuery): AdaptiveSubscriptionReview[] {
  return query.apply(store.list());
}
