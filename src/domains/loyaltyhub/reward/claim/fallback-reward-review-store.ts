import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackRewardReview } from "./fallback-reward-review.js";

/** Keeps fallback reward reviews by code. */
export interface FallbackRewardReviewStore {
  find(code: string): FallbackRewardReview | undefined;
  save(item: FallbackRewardReview): void;
  remove(code: string): boolean;
  list(): FallbackRewardReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackRewardReviewStore implements FallbackRewardReviewStore {
  items: Map<string, FallbackRewardReview>;
  order: string[];

  constructor(items: Map<string, FallbackRewardReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackRewardReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackRewardReview): void {
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

  list(): FallbackRewardReview[] {
    const out: FallbackRewardReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackRewardReviewStore(): FallbackRewardReviewStore {
  return new MemoryFallbackRewardReviewStore(new Map<string, FallbackRewardReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackRewardReviewStore implements FallbackRewardReviewStore {
  inner: FallbackRewardReviewStore;
  cache: cache.TtlCache<FallbackRewardReview>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackRewardReviewStore,
    cacheValue: cache.TtlCache<FallbackRewardReview>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackRewardReview | undefined {
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

  save(item: FallbackRewardReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackRewardReview[] {
    return this.inner.list();
  }
}

export function newCachedFallbackRewardReviewStore(inner: FallbackRewardReviewStore, ttl: number, clockValue: clock.Clock): FallbackRewardReviewStore {
  return new CachedFallbackRewardReviewStore(
    inner,
    cache.newTtlCache<FallbackRewardReview>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback reward reviews. Empty fields match all. */
export class FallbackRewardReviewQuery {
  region: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minEndsAt: number, statuses: string[], limit: number) {
    this.region = region;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackRewardReview): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackRewardReview[]): FallbackRewardReview[] {
    const matched = collections.filter(items, (candidate: FallbackRewardReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackRewardReviews(store: FallbackRewardReviewStore, query: FallbackRewardReviewQuery): FallbackRewardReview[] {
  return query.apply(store.list());
}
