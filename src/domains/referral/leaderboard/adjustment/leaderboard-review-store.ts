import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LeaderboardReview } from "./leaderboard-review.js";

/** Keeps leaderboard reviews by code. */
export interface LeaderboardReviewStore {
  find(code: string): LeaderboardReview | undefined;
  save(item: LeaderboardReview): void;
  remove(code: string): boolean;
  list(): LeaderboardReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLeaderboardReviewStore implements LeaderboardReviewStore {
  items: Map<string, LeaderboardReview>;
  order: string[];

  constructor(items: Map<string, LeaderboardReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LeaderboardReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LeaderboardReview): void {
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

  list(): LeaderboardReview[] {
    const out: LeaderboardReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLeaderboardReviewStore(): LeaderboardReviewStore {
  return new MemoryLeaderboardReviewStore(new Map<string, LeaderboardReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLeaderboardReviewStore implements LeaderboardReviewStore {
  inner: LeaderboardReviewStore;
  cache: cache.TtlCache<LeaderboardReview>;
  hits: number;
  misses: number;

  constructor(
    inner: LeaderboardReviewStore,
    cacheValue: cache.TtlCache<LeaderboardReview>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LeaderboardReview | undefined {
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

  save(item: LeaderboardReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LeaderboardReview[] {
    return this.inner.list();
  }
}

export function newCachedLeaderboardReviewStore(inner: LeaderboardReviewStore, ttl: number, clockValue: clock.Clock): LeaderboardReviewStore {
  return new CachedLeaderboardReviewStore(inner, cache.newTtlCache<LeaderboardReview>(64, ttl, clockValue), 0, 0);
}

/** Selects leaderboard reviews. Empty fields match all. */
export class LeaderboardReviewQuery {
  region: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minBudget: number, statuses: string[], limit: number) {
    this.region = region;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LeaderboardReview): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LeaderboardReview[]): LeaderboardReview[] {
    const matched = collections.filter(items, (candidate: LeaderboardReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLeaderboardReviews(store: LeaderboardReviewStore, query: LeaderboardReviewQuery): LeaderboardReview[] {
  return query.apply(store.list());
}
