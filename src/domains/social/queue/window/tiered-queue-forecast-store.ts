import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredQueueForecast } from "./tiered-queue-forecast.js";

/** Keeps tiered queue forecasts by code. */
export interface TieredQueueForecastStore {
  find(code: string): TieredQueueForecast | undefined;
  save(item: TieredQueueForecast): void;
  remove(code: string): boolean;
  list(): TieredQueueForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredQueueForecastStore implements TieredQueueForecastStore {
  items: Map<string, TieredQueueForecast>;
  order: string[];

  constructor(items: Map<string, TieredQueueForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredQueueForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredQueueForecast): void {
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

  list(): TieredQueueForecast[] {
    const out: TieredQueueForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredQueueForecastStore(): TieredQueueForecastStore {
  return new MemoryTieredQueueForecastStore(new Map<string, TieredQueueForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredQueueForecastStore implements TieredQueueForecastStore {
  inner: TieredQueueForecastStore;
  cache: cache.TtlCache<TieredQueueForecast>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredQueueForecastStore,
    cacheValue: cache.TtlCache<TieredQueueForecast>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredQueueForecast | undefined {
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

  save(item: TieredQueueForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredQueueForecast[] {
    return this.inner.list();
  }
}

export function newCachedTieredQueueForecastStore(inner: TieredQueueForecastStore, ttl: number, clockValue: clock.Clock): TieredQueueForecastStore {
  return new CachedTieredQueueForecastStore(inner, cache.newTtlCache<TieredQueueForecast>(128, ttl, clockValue), 0, 0);
}

/** Selects tiered queue forecasts. Empty fields match all. */
export class TieredQueueForecastQuery {
  locale: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredQueueForecast): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredQueueForecast[]): TieredQueueForecast[] {
    const matched = collections.filter(items, (candidate: TieredQueueForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredQueueForecasts(store: TieredQueueForecastStore, query: TieredQueueForecastQuery): TieredQueueForecast[] {
  return query.apply(store.list());
}
