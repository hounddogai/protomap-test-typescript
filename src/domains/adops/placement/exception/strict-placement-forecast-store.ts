import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictPlacementForecast } from "./strict-placement-forecast.js";

/** Keeps strict placement forecasts by code. */
export interface StrictPlacementForecastStore {
  find(code: string): StrictPlacementForecast | undefined;
  save(item: StrictPlacementForecast): void;
  remove(code: string): boolean;
  list(): StrictPlacementForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictPlacementForecastStore implements StrictPlacementForecastStore {
  items: Map<string, StrictPlacementForecast>;
  order: string[];

  constructor(items: Map<string, StrictPlacementForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictPlacementForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictPlacementForecast): void {
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

  list(): StrictPlacementForecast[] {
    const out: StrictPlacementForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictPlacementForecastStore(): StrictPlacementForecastStore {
  return new MemoryStrictPlacementForecastStore(new Map<string, StrictPlacementForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictPlacementForecastStore implements StrictPlacementForecastStore {
  inner: StrictPlacementForecastStore;
  cache: cache.TtlCache<StrictPlacementForecast>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictPlacementForecastStore,
    cacheValue: cache.TtlCache<StrictPlacementForecast>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictPlacementForecast | undefined {
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

  save(item: StrictPlacementForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictPlacementForecast[] {
    return this.inner.list();
  }
}

export function newCachedStrictPlacementForecastStore(inner: StrictPlacementForecastStore, ttl: number, clockValue: clock.Clock): StrictPlacementForecastStore {
  return new CachedStrictPlacementForecastStore(
    inner,
    cache.newTtlCache<StrictPlacementForecast>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects strict placement forecasts. Empty fields match all. */
export class StrictPlacementForecastQuery {
  locale: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictPlacementForecast): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictPlacementForecast[]): StrictPlacementForecast[] {
    const matched = collections.filter(items, (candidate: StrictPlacementForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictPlacementForecasts(store: StrictPlacementForecastStore, query: StrictPlacementForecastQuery): StrictPlacementForecast[] {
  return query.apply(store.list());
}
