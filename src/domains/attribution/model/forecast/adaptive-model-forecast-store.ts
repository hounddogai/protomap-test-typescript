import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveModelForecast } from "./adaptive-model-forecast.js";

/** Keeps adaptive model forecasts by code. */
export interface AdaptiveModelForecastStore {
  find(code: string): AdaptiveModelForecast | undefined;
  save(item: AdaptiveModelForecast): void;
  remove(code: string): boolean;
  list(): AdaptiveModelForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveModelForecastStore implements AdaptiveModelForecastStore {
  items: Map<string, AdaptiveModelForecast>;
  order: string[];

  constructor(items: Map<string, AdaptiveModelForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveModelForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveModelForecast): void {
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

  list(): AdaptiveModelForecast[] {
    const out: AdaptiveModelForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveModelForecastStore(): AdaptiveModelForecastStore {
  return new MemoryAdaptiveModelForecastStore(new Map<string, AdaptiveModelForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveModelForecastStore implements AdaptiveModelForecastStore {
  inner: AdaptiveModelForecastStore;
  cache: cache.TtlCache<AdaptiveModelForecast>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveModelForecastStore,
    cacheValue: cache.TtlCache<AdaptiveModelForecast>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveModelForecast | undefined {
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

  save(item: AdaptiveModelForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveModelForecast[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveModelForecastStore(inner: AdaptiveModelForecastStore, ttl: number, clockValue: clock.Clock): AdaptiveModelForecastStore {
  return new CachedAdaptiveModelForecastStore(
    inner,
    cache.newTtlCache<AdaptiveModelForecast>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive model forecasts. Empty fields match all. */
export class AdaptiveModelForecastQuery {
  locale: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minRatio: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveModelForecast): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveModelForecast[]): AdaptiveModelForecast[] {
    const matched = collections.filter(items, (candidate: AdaptiveModelForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveModelForecasts(store: AdaptiveModelForecastStore, query: AdaptiveModelForecastQuery): AdaptiveModelForecast[] {
  return query.apply(store.list());
}
