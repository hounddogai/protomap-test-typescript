import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedRewardForecast } from "./weighted-reward-forecast.js";

/** Keeps weighted reward forecasts by code. */
export interface WeightedRewardForecastStore {
  find(code: string): WeightedRewardForecast | undefined;
  save(item: WeightedRewardForecast): void;
  remove(code: string): boolean;
  list(): WeightedRewardForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedRewardForecastStore implements WeightedRewardForecastStore {
  items: Map<string, WeightedRewardForecast>;
  order: string[];

  constructor(items: Map<string, WeightedRewardForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedRewardForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedRewardForecast): void {
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

  list(): WeightedRewardForecast[] {
    const out: WeightedRewardForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedRewardForecastStore(): WeightedRewardForecastStore {
  return new MemoryWeightedRewardForecastStore(new Map<string, WeightedRewardForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedRewardForecastStore implements WeightedRewardForecastStore {
  inner: WeightedRewardForecastStore;
  cache: cache.TtlCache<WeightedRewardForecast>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedRewardForecastStore,
    cacheValue: cache.TtlCache<WeightedRewardForecast>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedRewardForecast | undefined {
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

  save(item: WeightedRewardForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedRewardForecast[] {
    return this.inner.list();
  }
}

export function newCachedWeightedRewardForecastStore(inner: WeightedRewardForecastStore, ttl: number, clockValue: clock.Clock): WeightedRewardForecastStore {
  return new CachedWeightedRewardForecastStore(
    inner,
    cache.newTtlCache<WeightedRewardForecast>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted reward forecasts. Empty fields match all. */
export class WeightedRewardForecastQuery {
  country: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minRatio: number, statuses: string[], limit: number) {
    this.country = country;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedRewardForecast): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedRewardForecast[]): WeightedRewardForecast[] {
    const matched = collections.filter(items, (candidate: WeightedRewardForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedRewardForecasts(store: WeightedRewardForecastStore, query: WeightedRewardForecastQuery): WeightedRewardForecast[] {
  return query.apply(store.list());
}
