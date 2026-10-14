import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FunnelForecast } from "./funnel-forecast.js";

/** Keeps funnel forecasts by code. */
export interface FunnelForecastStore {
  find(code: string): FunnelForecast | undefined;
  save(item: FunnelForecast): void;
  remove(code: string): boolean;
  list(): FunnelForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFunnelForecastStore implements FunnelForecastStore {
  items: Map<string, FunnelForecast>;
  order: string[];

  constructor(items: Map<string, FunnelForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FunnelForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FunnelForecast): void {
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

  list(): FunnelForecast[] {
    const out: FunnelForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFunnelForecastStore(): FunnelForecastStore {
  return new MemoryFunnelForecastStore(new Map<string, FunnelForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFunnelForecastStore implements FunnelForecastStore {
  inner: FunnelForecastStore;
  cache: cache.TtlCache<FunnelForecast>;
  hits: number;
  misses: number;

  constructor(
    inner: FunnelForecastStore,
    cacheValue: cache.TtlCache<FunnelForecast>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FunnelForecast | undefined {
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

  save(item: FunnelForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FunnelForecast[] {
    return this.inner.list();
  }
}

export function newCachedFunnelForecastStore(inner: FunnelForecastStore, ttl: number, clockValue: clock.Clock): FunnelForecastStore {
  return new CachedFunnelForecastStore(inner, cache.newTtlCache<FunnelForecast>(128, ttl, clockValue), 0, 0);
}

/** Selects funnel forecasts. Empty fields match all. */
export class FunnelForecastQuery {
  unit: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FunnelForecast): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FunnelForecast[]): FunnelForecast[] {
    const matched = collections.filter(items, (candidate: FunnelForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFunnelForecasts(store: FunnelForecastStore, query: FunnelForecastQuery): FunnelForecast[] {
  return query.apply(store.list());
}
