import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PathForecast } from "./path-forecast.js";

/** Keeps path forecasts by code. */
export interface PathForecastStore {
  find(code: string): PathForecast | undefined;
  save(item: PathForecast): void;
  remove(code: string): boolean;
  list(): PathForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPathForecastStore implements PathForecastStore {
  items: Map<string, PathForecast>;
  order: string[];

  constructor(items: Map<string, PathForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PathForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PathForecast): void {
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

  list(): PathForecast[] {
    const out: PathForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPathForecastStore(): PathForecastStore {
  return new MemoryPathForecastStore(new Map<string, PathForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPathForecastStore implements PathForecastStore {
  inner: PathForecastStore;
  cache: cache.TtlCache<PathForecast>;
  hits: number;
  misses: number;

  constructor(inner: PathForecastStore, cacheValue: cache.TtlCache<PathForecast>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PathForecast | undefined {
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

  save(item: PathForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PathForecast[] {
    return this.inner.list();
  }
}

export function newCachedPathForecastStore(inner: PathForecastStore, ttl: number, clockValue: clock.Clock): PathForecastStore {
  return new CachedPathForecastStore(inner, cache.newTtlCache<PathForecast>(512, ttl, clockValue), 0, 0);
}

/** Selects path forecasts. Empty fields match all. */
export class PathForecastQuery {
  locale: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minCeiling: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PathForecast): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PathForecast[]): PathForecast[] {
    const matched = collections.filter(items, (candidate: PathForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPathForecasts(store: PathForecastStore, query: PathForecastQuery): PathForecast[] {
  return query.apply(store.list());
}
