import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackStreakForecast } from "./fallback-streak-forecast.js";

/** Keeps fallback streak forecasts by code. */
export interface FallbackStreakForecastStore {
  find(code: string): FallbackStreakForecast | undefined;
  save(item: FallbackStreakForecast): void;
  remove(code: string): boolean;
  list(): FallbackStreakForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackStreakForecastStore implements FallbackStreakForecastStore {
  items: Map<string, FallbackStreakForecast>;
  order: string[];

  constructor(items: Map<string, FallbackStreakForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackStreakForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackStreakForecast): void {
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

  list(): FallbackStreakForecast[] {
    const out: FallbackStreakForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackStreakForecastStore(): FallbackStreakForecastStore {
  return new MemoryFallbackStreakForecastStore(new Map<string, FallbackStreakForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackStreakForecastStore implements FallbackStreakForecastStore {
  inner: FallbackStreakForecastStore;
  cache: cache.TtlCache<FallbackStreakForecast>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackStreakForecastStore,
    cacheValue: cache.TtlCache<FallbackStreakForecast>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackStreakForecast | undefined {
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

  save(item: FallbackStreakForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackStreakForecast[] {
    return this.inner.list();
  }
}

export function newCachedFallbackStreakForecastStore(inner: FallbackStreakForecastStore, ttl: number, clockValue: clock.Clock): FallbackStreakForecastStore {
  return new CachedFallbackStreakForecastStore(
    inner,
    cache.newTtlCache<FallbackStreakForecast>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback streak forecasts. Empty fields match all. */
export class FallbackStreakForecastQuery {
  title: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minDiscount: number, statuses: string[], limit: number) {
    this.title = title;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackStreakForecast): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackStreakForecast[]): FallbackStreakForecast[] {
    const matched = collections.filter(items, (candidate: FallbackStreakForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackStreakForecasts(store: FallbackStreakForecastStore, query: FallbackStreakForecastQuery): FallbackStreakForecast[] {
  return query.apply(store.list());
}
