import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BadgeForecast } from "./badge-forecast.js";

/** Keeps badge forecasts by code. */
export interface BadgeForecastStore {
  find(code: string): BadgeForecast | undefined;
  save(item: BadgeForecast): void;
  remove(code: string): boolean;
  list(): BadgeForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBadgeForecastStore implements BadgeForecastStore {
  items: Map<string, BadgeForecast>;
  order: string[];

  constructor(items: Map<string, BadgeForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BadgeForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BadgeForecast): void {
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

  list(): BadgeForecast[] {
    const out: BadgeForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBadgeForecastStore(): BadgeForecastStore {
  return new MemoryBadgeForecastStore(new Map<string, BadgeForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBadgeForecastStore implements BadgeForecastStore {
  inner: BadgeForecastStore;
  cache: cache.TtlCache<BadgeForecast>;
  hits: number;
  misses: number;

  constructor(inner: BadgeForecastStore, cacheValue: cache.TtlCache<BadgeForecast>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BadgeForecast | undefined {
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

  save(item: BadgeForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BadgeForecast[] {
    return this.inner.list();
  }
}

export function newCachedBadgeForecastStore(inner: BadgeForecastStore, ttl: number, clockValue: clock.Clock): BadgeForecastStore {
  return new CachedBadgeForecastStore(inner, cache.newTtlCache<BadgeForecast>(512, ttl, clockValue), 0, 0);
}

/** Selects badge forecasts. Empty fields match all. */
export class BadgeForecastQuery {
  unit: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minRate: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BadgeForecast): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BadgeForecast[]): BadgeForecast[] {
    const matched = collections.filter(items, (candidate: BadgeForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBadgeForecasts(store: BadgeForecastStore, query: BadgeForecastQuery): BadgeForecast[] {
  return query.apply(store.list());
}
