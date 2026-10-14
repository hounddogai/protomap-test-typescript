import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackCohortForecast } from "./fallback-cohort-forecast.js";

/** Keeps fallback cohort forecasts by code. */
export interface FallbackCohortForecastStore {
  find(code: string): FallbackCohortForecast | undefined;
  save(item: FallbackCohortForecast): void;
  remove(code: string): boolean;
  list(): FallbackCohortForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackCohortForecastStore implements FallbackCohortForecastStore {
  items: Map<string, FallbackCohortForecast>;
  order: string[];

  constructor(items: Map<string, FallbackCohortForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackCohortForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackCohortForecast): void {
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

  list(): FallbackCohortForecast[] {
    const out: FallbackCohortForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackCohortForecastStore(): FallbackCohortForecastStore {
  return new MemoryFallbackCohortForecastStore(new Map<string, FallbackCohortForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackCohortForecastStore implements FallbackCohortForecastStore {
  inner: FallbackCohortForecastStore;
  cache: cache.TtlCache<FallbackCohortForecast>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackCohortForecastStore,
    cacheValue: cache.TtlCache<FallbackCohortForecast>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackCohortForecast | undefined {
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

  save(item: FallbackCohortForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackCohortForecast[] {
    return this.inner.list();
  }
}

export function newCachedFallbackCohortForecastStore(inner: FallbackCohortForecastStore, ttl: number, clockValue: clock.Clock): FallbackCohortForecastStore {
  return new CachedFallbackCohortForecastStore(
    inner,
    cache.newTtlCache<FallbackCohortForecast>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback cohort forecasts. Empty fields match all. */
export class FallbackCohortForecastQuery {
  name: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minConversionRate: number, statuses: string[], limit: number) {
    this.name = name;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackCohortForecast): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackCohortForecast[]): FallbackCohortForecast[] {
    const matched = collections.filter(items, (candidate: FallbackCohortForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackCohortForecasts(store: FallbackCohortForecastStore, query: FallbackCohortForecastQuery): FallbackCohortForecast[] {
  return query.apply(store.list());
}
