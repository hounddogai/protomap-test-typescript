import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingPaywallReview } from "./rolling-paywall-review.js";

/** Keeps rolling paywall reviews by code. */
export interface RollingPaywallReviewStore {
  find(code: string): RollingPaywallReview | undefined;
  save(item: RollingPaywallReview): void;
  remove(code: string): boolean;
  list(): RollingPaywallReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingPaywallReviewStore implements RollingPaywallReviewStore {
  items: Map<string, RollingPaywallReview>;
  order: string[];

  constructor(items: Map<string, RollingPaywallReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingPaywallReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingPaywallReview): void {
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

  list(): RollingPaywallReview[] {
    const out: RollingPaywallReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingPaywallReviewStore(): RollingPaywallReviewStore {
  return new MemoryRollingPaywallReviewStore(new Map<string, RollingPaywallReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingPaywallReviewStore implements RollingPaywallReviewStore {
  inner: RollingPaywallReviewStore;
  cache: cache.TtlCache<RollingPaywallReview>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingPaywallReviewStore,
    cacheValue: cache.TtlCache<RollingPaywallReview>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingPaywallReview | undefined {
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

  save(item: RollingPaywallReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingPaywallReview[] {
    return this.inner.list();
  }
}

export function newCachedRollingPaywallReviewStore(inner: RollingPaywallReviewStore, ttl: number, clockValue: clock.Clock): RollingPaywallReviewStore {
  return new CachedRollingPaywallReviewStore(inner, cache.newTtlCache<RollingPaywallReview>(64, ttl, clockValue), 0, 0);
}

/** Selects rolling paywall reviews. Empty fields match all. */
export class RollingPaywallReviewQuery {
  region: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minBid: number, statuses: string[], limit: number) {
    this.region = region;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingPaywallReview): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingPaywallReview[]): RollingPaywallReview[] {
    const matched = collections.filter(items, (candidate: RollingPaywallReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingPaywallReviews(store: RollingPaywallReviewStore, query: RollingPaywallReviewQuery): RollingPaywallReview[] {
  return query.apply(store.list());
}
