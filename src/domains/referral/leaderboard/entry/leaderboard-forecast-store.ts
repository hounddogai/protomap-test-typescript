import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LeaderboardForecast } from "./leaderboard-forecast.js";

/** Keeps leaderboard forecasts by code. */
export interface LeaderboardForecastStore {
  find(code: string): LeaderboardForecast | undefined;
  save(item: LeaderboardForecast): void;
  remove(code: string): boolean;
  list(): LeaderboardForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLeaderboardForecastStore implements LeaderboardForecastStore {
  items: Map<string, LeaderboardForecast>;
  order: string[];

  constructor(items: Map<string, LeaderboardForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LeaderboardForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LeaderboardForecast): void {
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

  list(): LeaderboardForecast[] {
    const out: LeaderboardForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLeaderboardForecastStore(): LeaderboardForecastStore {
  return new MemoryLeaderboardForecastStore(new Map<string, LeaderboardForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLeaderboardForecastStore implements LeaderboardForecastStore {
  inner: LeaderboardForecastStore;
  cache: cache.TtlCache<LeaderboardForecast>;
  hits: number;
  misses: number;

  constructor(
    inner: LeaderboardForecastStore,
    cacheValue: cache.TtlCache<LeaderboardForecast>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LeaderboardForecast | undefined {
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

  save(item: LeaderboardForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LeaderboardForecast[] {
    return this.inner.list();
  }
}

export function newCachedLeaderboardForecastStore(inner: LeaderboardForecastStore, ttl: number, clockValue: clock.Clock): LeaderboardForecastStore {
  return new CachedLeaderboardForecastStore(inner, cache.newTtlCache<LeaderboardForecast>(64, ttl, clockValue), 0, 0);
}

/** Selects leaderboard forecasts. Empty fields match all. */
export class LeaderboardForecastQuery {
  locale: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minVersion: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LeaderboardForecast): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LeaderboardForecast[]): LeaderboardForecast[] {
    const matched = collections.filter(items, (candidate: LeaderboardForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLeaderboardForecasts(store: LeaderboardForecastStore, query: LeaderboardForecastQuery): LeaderboardForecast[] {
  return query.apply(store.list());
}
