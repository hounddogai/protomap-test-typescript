import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PlacementForecast } from "./placement-forecast.js";

/** Keeps placement forecasts by code. */
export interface PlacementForecastStore {
  find(code: string): PlacementForecast | undefined;
  save(item: PlacementForecast): void;
  remove(code: string): boolean;
  list(): PlacementForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPlacementForecastStore implements PlacementForecastStore {
  items: Map<string, PlacementForecast>;
  order: string[];

  constructor(items: Map<string, PlacementForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PlacementForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PlacementForecast): void {
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

  list(): PlacementForecast[] {
    const out: PlacementForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPlacementForecastStore(): PlacementForecastStore {
  return new MemoryPlacementForecastStore(new Map<string, PlacementForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPlacementForecastStore implements PlacementForecastStore {
  inner: PlacementForecastStore;
  cache: cache.TtlCache<PlacementForecast>;
  hits: number;
  misses: number;

  constructor(
    inner: PlacementForecastStore,
    cacheValue: cache.TtlCache<PlacementForecast>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PlacementForecast | undefined {
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

  save(item: PlacementForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PlacementForecast[] {
    return this.inner.list();
  }
}

export function newCachedPlacementForecastStore(inner: PlacementForecastStore, ttl: number, clockValue: clock.Clock): PlacementForecastStore {
  return new CachedPlacementForecastStore(inner, cache.newTtlCache<PlacementForecast>(1024, ttl, clockValue), 0, 0);
}

/** Selects placement forecasts. Empty fields match all. */
export class PlacementForecastQuery {
  utmSource: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minMaximum: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PlacementForecast): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PlacementForecast[]): PlacementForecast[] {
    const matched = collections.filter(items, (candidate: PlacementForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPlacementForecasts(store: PlacementForecastStore, query: PlacementForecastQuery): PlacementForecast[] {
  return query.apply(store.list());
}
