import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { EnrollmentForecast } from "./enrollment-forecast.js";

/** Keeps enrollment forecasts by code. */
export interface EnrollmentForecastStore {
  find(code: string): EnrollmentForecast | undefined;
  save(item: EnrollmentForecast): void;
  remove(code: string): boolean;
  list(): EnrollmentForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryEnrollmentForecastStore implements EnrollmentForecastStore {
  items: Map<string, EnrollmentForecast>;
  order: string[];

  constructor(items: Map<string, EnrollmentForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): EnrollmentForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: EnrollmentForecast): void {
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

  list(): EnrollmentForecast[] {
    const out: EnrollmentForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryEnrollmentForecastStore(): EnrollmentForecastStore {
  return new MemoryEnrollmentForecastStore(new Map<string, EnrollmentForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedEnrollmentForecastStore implements EnrollmentForecastStore {
  inner: EnrollmentForecastStore;
  cache: cache.TtlCache<EnrollmentForecast>;
  hits: number;
  misses: number;

  constructor(
    inner: EnrollmentForecastStore,
    cacheValue: cache.TtlCache<EnrollmentForecast>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): EnrollmentForecast | undefined {
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

  save(item: EnrollmentForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): EnrollmentForecast[] {
    return this.inner.list();
  }
}

export function newCachedEnrollmentForecastStore(inner: EnrollmentForecastStore, ttl: number, clockValue: clock.Clock): EnrollmentForecastStore {
  return new CachedEnrollmentForecastStore(inner, cache.newTtlCache<EnrollmentForecast>(512, ttl, clockValue), 0, 0);
}

/** Selects enrollment forecasts. Empty fields match all. */
export class EnrollmentForecastQuery {
  region: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minDiscount: number, statuses: string[], limit: number) {
    this.region = region;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: EnrollmentForecast): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: EnrollmentForecast[]): EnrollmentForecast[] {
    const matched = collections.filter(items, (candidate: EnrollmentForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findEnrollmentForecasts(store: EnrollmentForecastStore, query: EnrollmentForecastQuery): EnrollmentForecast[] {
  return query.apply(store.list());
}
