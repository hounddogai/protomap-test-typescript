import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalWindowForecast } from "./seasonal-window-forecast.js";

/** Keeps seasonal window forecasts by code. */
export interface SeasonalWindowForecastStore {
  find(code: string): SeasonalWindowForecast | undefined;
  save(item: SeasonalWindowForecast): void;
  remove(code: string): boolean;
  list(): SeasonalWindowForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalWindowForecastStore implements SeasonalWindowForecastStore {
  items: Map<string, SeasonalWindowForecast>;
  order: string[];

  constructor(items: Map<string, SeasonalWindowForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalWindowForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalWindowForecast): void {
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

  list(): SeasonalWindowForecast[] {
    const out: SeasonalWindowForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalWindowForecastStore(): SeasonalWindowForecastStore {
  return new MemorySeasonalWindowForecastStore(new Map<string, SeasonalWindowForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalWindowForecastStore implements SeasonalWindowForecastStore {
  inner: SeasonalWindowForecastStore;
  cache: cache.TtlCache<SeasonalWindowForecast>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalWindowForecastStore,
    cacheValue: cache.TtlCache<SeasonalWindowForecast>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalWindowForecast | undefined {
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

  save(item: SeasonalWindowForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalWindowForecast[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalWindowForecastStore(inner: SeasonalWindowForecastStore, ttl: number, clockValue: clock.Clock): SeasonalWindowForecastStore {
  return new CachedSeasonalWindowForecastStore(
    inner,
    cache.newTtlCache<SeasonalWindowForecast>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal window forecasts. Empty fields match all. */
export class SeasonalWindowForecastQuery {
  name: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minClicks: number, statuses: string[], limit: number) {
    this.name = name;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalWindowForecast): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalWindowForecast[]): SeasonalWindowForecast[] {
    const matched = collections.filter(items, (candidate: SeasonalWindowForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalWindowForecasts(store: SeasonalWindowForecastStore, query: SeasonalWindowForecastQuery): SeasonalWindowForecast[] {
  return query.apply(store.list());
}
