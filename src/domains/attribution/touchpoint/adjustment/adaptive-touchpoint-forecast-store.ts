import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveTouchpointForecast } from "./adaptive-touchpoint-forecast.js";

/** Keeps adaptive touchpoint forecasts by code. */
export interface AdaptiveTouchpointForecastStore {
  find(code: string): AdaptiveTouchpointForecast | undefined;
  save(item: AdaptiveTouchpointForecast): void;
  remove(code: string): boolean;
  list(): AdaptiveTouchpointForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveTouchpointForecastStore implements AdaptiveTouchpointForecastStore {
  items: Map<string, AdaptiveTouchpointForecast>;
  order: string[];

  constructor(items: Map<string, AdaptiveTouchpointForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveTouchpointForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveTouchpointForecast): void {
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

  list(): AdaptiveTouchpointForecast[] {
    const out: AdaptiveTouchpointForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveTouchpointForecastStore(): AdaptiveTouchpointForecastStore {
  return new MemoryAdaptiveTouchpointForecastStore(new Map<string, AdaptiveTouchpointForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveTouchpointForecastStore implements AdaptiveTouchpointForecastStore {
  inner: AdaptiveTouchpointForecastStore;
  cache: cache.TtlCache<AdaptiveTouchpointForecast>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveTouchpointForecastStore,
    cacheValue: cache.TtlCache<AdaptiveTouchpointForecast>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveTouchpointForecast | undefined {
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

  save(item: AdaptiveTouchpointForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveTouchpointForecast[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveTouchpointForecastStore(inner: AdaptiveTouchpointForecastStore, ttl: number, clockValue: clock.Clock): AdaptiveTouchpointForecastStore {
  return new CachedAdaptiveTouchpointForecastStore(
    inner,
    cache.newTtlCache<AdaptiveTouchpointForecast>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive touchpoint forecasts. Empty fields match all. */
export class AdaptiveTouchpointForecastQuery {
  unit: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minConversionRate: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveTouchpointForecast): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveTouchpointForecast[]): AdaptiveTouchpointForecast[] {
    const matched = collections.filter(items, (candidate: AdaptiveTouchpointForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveTouchpointForecasts(store: AdaptiveTouchpointForecastStore, query: AdaptiveTouchpointForecastQuery): AdaptiveTouchpointForecast[] {
  return query.apply(store.list());
}
