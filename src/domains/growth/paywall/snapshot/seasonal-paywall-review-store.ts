import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalPaywallReview } from "./seasonal-paywall-review.js";

/** Keeps seasonal paywall reviews by code. */
export interface SeasonalPaywallReviewStore {
  find(code: string): SeasonalPaywallReview | undefined;
  save(item: SeasonalPaywallReview): void;
  remove(code: string): boolean;
  list(): SeasonalPaywallReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalPaywallReviewStore implements SeasonalPaywallReviewStore {
  items: Map<string, SeasonalPaywallReview>;
  order: string[];

  constructor(items: Map<string, SeasonalPaywallReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalPaywallReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalPaywallReview): void {
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

  list(): SeasonalPaywallReview[] {
    const out: SeasonalPaywallReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalPaywallReviewStore(): SeasonalPaywallReviewStore {
  return new MemorySeasonalPaywallReviewStore(new Map<string, SeasonalPaywallReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalPaywallReviewStore implements SeasonalPaywallReviewStore {
  inner: SeasonalPaywallReviewStore;
  cache: cache.TtlCache<SeasonalPaywallReview>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalPaywallReviewStore,
    cacheValue: cache.TtlCache<SeasonalPaywallReview>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalPaywallReview | undefined {
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

  save(item: SeasonalPaywallReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalPaywallReview[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalPaywallReviewStore(inner: SeasonalPaywallReviewStore, ttl: number, clockValue: clock.Clock): SeasonalPaywallReviewStore {
  return new CachedSeasonalPaywallReviewStore(
    inner,
    cache.newTtlCache<SeasonalPaywallReview>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal paywall reviews. Empty fields match all. */
export class SeasonalPaywallReviewQuery {
  source: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minMaximum: number, statuses: string[], limit: number) {
    this.source = source;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalPaywallReview): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalPaywallReview[]): SeasonalPaywallReview[] {
    const matched = collections.filter(items, (candidate: SeasonalPaywallReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalPaywallReviews(store: SeasonalPaywallReviewStore, query: SeasonalPaywallReviewQuery): SeasonalPaywallReview[] {
  return query.apply(store.list());
}
