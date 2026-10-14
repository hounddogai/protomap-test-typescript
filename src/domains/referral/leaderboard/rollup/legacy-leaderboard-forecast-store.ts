import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyLeaderboardForecast } from "./legacy-leaderboard-forecast.js";

/** Keeps legacy leaderboard forecasts by code. */
export interface LegacyLeaderboardForecastStore {
  find(code: string): LegacyLeaderboardForecast | undefined;
  save(item: LegacyLeaderboardForecast): void;
  remove(code: string): boolean;
  list(): LegacyLeaderboardForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyLeaderboardForecastStore implements LegacyLeaderboardForecastStore {
  items: Map<string, LegacyLeaderboardForecast>;
  order: string[];

  constructor(items: Map<string, LegacyLeaderboardForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyLeaderboardForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyLeaderboardForecast): void {
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

  list(): LegacyLeaderboardForecast[] {
    const out: LegacyLeaderboardForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyLeaderboardForecastStore(): LegacyLeaderboardForecastStore {
  return new MemoryLegacyLeaderboardForecastStore(new Map<string, LegacyLeaderboardForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyLeaderboardForecastStore implements LegacyLeaderboardForecastStore {
  inner: LegacyLeaderboardForecastStore;
  cache: cache.TtlCache<LegacyLeaderboardForecast>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyLeaderboardForecastStore,
    cacheValue: cache.TtlCache<LegacyLeaderboardForecast>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyLeaderboardForecast | undefined {
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

  save(item: LegacyLeaderboardForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyLeaderboardForecast[] {
    return this.inner.list();
  }
}

export function newCachedLegacyLeaderboardForecastStore(inner: LegacyLeaderboardForecastStore, ttl: number, clockValue: clock.Clock): LegacyLeaderboardForecastStore {
  return new CachedLegacyLeaderboardForecastStore(
    inner,
    cache.newTtlCache<LegacyLeaderboardForecast>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy leaderboard forecasts. Empty fields match all. */
export class LegacyLeaderboardForecastQuery {
  unit: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minMargin: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyLeaderboardForecast): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyLeaderboardForecast[]): LegacyLeaderboardForecast[] {
    const matched = collections.filter(items, (candidate: LegacyLeaderboardForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyLeaderboardForecasts(store: LegacyLeaderboardForecastStore, query: LegacyLeaderboardForecastQuery): LegacyLeaderboardForecast[] {
  return query.apply(store.list());
}
