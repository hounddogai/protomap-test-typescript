import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveLevelForecast } from "./adaptive-level-forecast.js";

/** Keeps adaptive level forecasts by code. */
export interface AdaptiveLevelForecastStore {
  find(code: string): AdaptiveLevelForecast | undefined;
  save(item: AdaptiveLevelForecast): void;
  remove(code: string): boolean;
  list(): AdaptiveLevelForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveLevelForecastStore implements AdaptiveLevelForecastStore {
  items: Map<string, AdaptiveLevelForecast>;
  order: string[];

  constructor(items: Map<string, AdaptiveLevelForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveLevelForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveLevelForecast): void {
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

  list(): AdaptiveLevelForecast[] {
    const out: AdaptiveLevelForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveLevelForecastStore(): AdaptiveLevelForecastStore {
  return new MemoryAdaptiveLevelForecastStore(new Map<string, AdaptiveLevelForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveLevelForecastStore implements AdaptiveLevelForecastStore {
  inner: AdaptiveLevelForecastStore;
  cache: cache.TtlCache<AdaptiveLevelForecast>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveLevelForecastStore,
    cacheValue: cache.TtlCache<AdaptiveLevelForecast>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveLevelForecast | undefined {
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

  save(item: AdaptiveLevelForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveLevelForecast[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveLevelForecastStore(inner: AdaptiveLevelForecastStore, ttl: number, clockValue: clock.Clock): AdaptiveLevelForecastStore {
  return new CachedAdaptiveLevelForecastStore(
    inner,
    cache.newTtlCache<AdaptiveLevelForecast>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive level forecasts. Empty fields match all. */
export class AdaptiveLevelForecastQuery {
  region: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minMinimum: number, statuses: string[], limit: number) {
    this.region = region;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveLevelForecast): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveLevelForecast[]): AdaptiveLevelForecast[] {
    const matched = collections.filter(items, (candidate: AdaptiveLevelForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveLevelForecasts(store: AdaptiveLevelForecastStore, query: AdaptiveLevelForecastQuery): AdaptiveLevelForecast[] {
  return query.apply(store.list());
}
