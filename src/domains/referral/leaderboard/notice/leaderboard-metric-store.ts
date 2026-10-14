import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LeaderboardMetric } from "./leaderboard-metric.js";

/** Keeps leaderboard metrics by code. */
export interface LeaderboardMetricStore {
  find(code: string): LeaderboardMetric | undefined;
  save(item: LeaderboardMetric): void;
  remove(code: string): boolean;
  list(): LeaderboardMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLeaderboardMetricStore implements LeaderboardMetricStore {
  items: Map<string, LeaderboardMetric>;
  order: string[];

  constructor(items: Map<string, LeaderboardMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LeaderboardMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LeaderboardMetric): void {
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

  list(): LeaderboardMetric[] {
    const out: LeaderboardMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLeaderboardMetricStore(): LeaderboardMetricStore {
  return new MemoryLeaderboardMetricStore(new Map<string, LeaderboardMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLeaderboardMetricStore implements LeaderboardMetricStore {
  inner: LeaderboardMetricStore;
  cache: cache.TtlCache<LeaderboardMetric>;
  hits: number;
  misses: number;

  constructor(
    inner: LeaderboardMetricStore,
    cacheValue: cache.TtlCache<LeaderboardMetric>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LeaderboardMetric | undefined {
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

  save(item: LeaderboardMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LeaderboardMetric[] {
    return this.inner.list();
  }
}

export function newCachedLeaderboardMetricStore(inner: LeaderboardMetricStore, ttl: number, clockValue: clock.Clock): LeaderboardMetricStore {
  return new CachedLeaderboardMetricStore(inner, cache.newTtlCache<LeaderboardMetric>(64, ttl, clockValue), 0, 0);
}

/** Selects leaderboard metrics. Empty fields match all. */
export class LeaderboardMetricQuery {
  category: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minThreshold: number, statuses: string[], limit: number) {
    this.category = category;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LeaderboardMetric): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LeaderboardMetric[]): LeaderboardMetric[] {
    const matched = collections.filter(items, (candidate: LeaderboardMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLeaderboardMetrics(store: LeaderboardMetricStore, query: LeaderboardMetricQuery): LeaderboardMetric[] {
  return query.apply(store.list());
}
