import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyLeaderboardReview } from "./legacy-leaderboard-review.js";

/** Keeps legacy leaderboard reviews by code. */
export interface LegacyLeaderboardReviewStore {
  find(code: string): LegacyLeaderboardReview | undefined;
  save(item: LegacyLeaderboardReview): void;
  remove(code: string): boolean;
  list(): LegacyLeaderboardReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyLeaderboardReviewStore implements LegacyLeaderboardReviewStore {
  items: Map<string, LegacyLeaderboardReview>;
  order: string[];

  constructor(items: Map<string, LegacyLeaderboardReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyLeaderboardReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyLeaderboardReview): void {
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

  list(): LegacyLeaderboardReview[] {
    const out: LegacyLeaderboardReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyLeaderboardReviewStore(): LegacyLeaderboardReviewStore {
  return new MemoryLegacyLeaderboardReviewStore(new Map<string, LegacyLeaderboardReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyLeaderboardReviewStore implements LegacyLeaderboardReviewStore {
  inner: LegacyLeaderboardReviewStore;
  cache: cache.TtlCache<LegacyLeaderboardReview>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyLeaderboardReviewStore,
    cacheValue: cache.TtlCache<LegacyLeaderboardReview>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyLeaderboardReview | undefined {
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

  save(item: LegacyLeaderboardReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyLeaderboardReview[] {
    return this.inner.list();
  }
}

export function newCachedLegacyLeaderboardReviewStore(inner: LegacyLeaderboardReviewStore, ttl: number, clockValue: clock.Clock): LegacyLeaderboardReviewStore {
  return new CachedLegacyLeaderboardReviewStore(
    inner,
    cache.newTtlCache<LegacyLeaderboardReview>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy leaderboard reviews. Empty fields match all. */
export class LegacyLeaderboardReviewQuery {
  title: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minWindowDays: number, statuses: string[], limit: number) {
    this.title = title;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyLeaderboardReview): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyLeaderboardReview[]): LegacyLeaderboardReview[] {
    const matched = collections.filter(items, (candidate: LegacyLeaderboardReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyLeaderboardReviews(store: LegacyLeaderboardReviewStore, query: LegacyLeaderboardReviewQuery): LegacyLeaderboardReview[] {
  return query.apply(store.list());
}
