import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LeaderboardEstimate } from "./leaderboard-estimate.js";

/** Keeps leaderboard estimates by code. */
export interface LeaderboardEstimateStore {
  find(code: string): LeaderboardEstimate | undefined;
  save(item: LeaderboardEstimate): void;
  remove(code: string): boolean;
  list(): LeaderboardEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLeaderboardEstimateStore implements LeaderboardEstimateStore {
  items: Map<string, LeaderboardEstimate>;
  order: string[];

  constructor(items: Map<string, LeaderboardEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LeaderboardEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LeaderboardEstimate): void {
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

  list(): LeaderboardEstimate[] {
    const out: LeaderboardEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLeaderboardEstimateStore(): LeaderboardEstimateStore {
  return new MemoryLeaderboardEstimateStore(new Map<string, LeaderboardEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLeaderboardEstimateStore implements LeaderboardEstimateStore {
  inner: LeaderboardEstimateStore;
  cache: cache.TtlCache<LeaderboardEstimate>;
  hits: number;
  misses: number;

  constructor(
    inner: LeaderboardEstimateStore,
    cacheValue: cache.TtlCache<LeaderboardEstimate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LeaderboardEstimate | undefined {
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

  save(item: LeaderboardEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LeaderboardEstimate[] {
    return this.inner.list();
  }
}

export function newCachedLeaderboardEstimateStore(inner: LeaderboardEstimateStore, ttl: number, clockValue: clock.Clock): LeaderboardEstimateStore {
  return new CachedLeaderboardEstimateStore(inner, cache.newTtlCache<LeaderboardEstimate>(1024, ttl, clockValue), 0, 0);
}

/** Selects leaderboard estimates. Empty fields match all. */
export class LeaderboardEstimateQuery {
  segment: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minRate: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LeaderboardEstimate): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LeaderboardEstimate[]): LeaderboardEstimate[] {
    const matched = collections.filter(items, (candidate: LeaderboardEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLeaderboardEstimates(store: LeaderboardEstimateStore, query: LeaderboardEstimateQuery): LeaderboardEstimate[] {
  return query.apply(store.list());
}
