import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalSubscriptionReview } from "./regional-subscription-review.js";

/** Keeps regional subscription reviews by code. */
export interface RegionalSubscriptionReviewStore {
  find(code: string): RegionalSubscriptionReview | undefined;
  save(item: RegionalSubscriptionReview): void;
  remove(code: string): boolean;
  list(): RegionalSubscriptionReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalSubscriptionReviewStore implements RegionalSubscriptionReviewStore {
  items: Map<string, RegionalSubscriptionReview>;
  order: string[];

  constructor(items: Map<string, RegionalSubscriptionReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalSubscriptionReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalSubscriptionReview): void {
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

  list(): RegionalSubscriptionReview[] {
    const out: RegionalSubscriptionReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalSubscriptionReviewStore(): RegionalSubscriptionReviewStore {
  return new MemoryRegionalSubscriptionReviewStore(new Map<string, RegionalSubscriptionReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalSubscriptionReviewStore implements RegionalSubscriptionReviewStore {
  inner: RegionalSubscriptionReviewStore;
  cache: cache.TtlCache<RegionalSubscriptionReview>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalSubscriptionReviewStore,
    cacheValue: cache.TtlCache<RegionalSubscriptionReview>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalSubscriptionReview | undefined {
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

  save(item: RegionalSubscriptionReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalSubscriptionReview[] {
    return this.inner.list();
  }
}

export function newCachedRegionalSubscriptionReviewStore(inner: RegionalSubscriptionReviewStore, ttl: number, clockValue: clock.Clock): RegionalSubscriptionReviewStore {
  return new CachedRegionalSubscriptionReviewStore(
    inner,
    cache.newTtlCache<RegionalSubscriptionReview>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional subscription reviews. Empty fields match all. */
export class RegionalSubscriptionReviewQuery {
  locale: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minConversionRate: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalSubscriptionReview): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalSubscriptionReview[]): RegionalSubscriptionReview[] {
    const matched = collections.filter(items, (candidate: RegionalSubscriptionReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalSubscriptionReviews(store: RegionalSubscriptionReviewStore, query: RegionalSubscriptionReviewQuery): RegionalSubscriptionReview[] {
  return query.apply(store.list());
}
