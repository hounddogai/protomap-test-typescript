import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalRewardForecast } from "./seasonal-reward-forecast.js";

/** Keeps seasonal reward forecasts by code. */
export interface SeasonalRewardForecastStore {
  find(code: string): SeasonalRewardForecast | undefined;
  save(item: SeasonalRewardForecast): void;
  remove(code: string): boolean;
  list(): SeasonalRewardForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalRewardForecastStore implements SeasonalRewardForecastStore {
  items: Map<string, SeasonalRewardForecast>;
  order: string[];

  constructor(items: Map<string, SeasonalRewardForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalRewardForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalRewardForecast): void {
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

  list(): SeasonalRewardForecast[] {
    const out: SeasonalRewardForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalRewardForecastStore(): SeasonalRewardForecastStore {
  return new MemorySeasonalRewardForecastStore(new Map<string, SeasonalRewardForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalRewardForecastStore implements SeasonalRewardForecastStore {
  inner: SeasonalRewardForecastStore;
  cache: cache.TtlCache<SeasonalRewardForecast>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalRewardForecastStore,
    cacheValue: cache.TtlCache<SeasonalRewardForecast>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalRewardForecast | undefined {
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

  save(item: SeasonalRewardForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalRewardForecast[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalRewardForecastStore(inner: SeasonalRewardForecastStore, ttl: number, clockValue: clock.Clock): SeasonalRewardForecastStore {
  return new CachedSeasonalRewardForecastStore(
    inner,
    cache.newTtlCache<SeasonalRewardForecast>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal reward forecasts. Empty fields match all. */
export class SeasonalRewardForecastQuery {
  locale: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minPriority: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalRewardForecast): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalRewardForecast[]): SeasonalRewardForecast[] {
    const matched = collections.filter(items, (candidate: SeasonalRewardForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalRewardForecasts(store: SeasonalRewardForecastStore, query: SeasonalRewardForecastQuery): SeasonalRewardForecast[] {
  return query.apply(store.list());
}
