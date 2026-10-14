import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BounceForecast } from "./bounce-forecast.js";

/** Keeps bounce forecasts by code. */
export interface BounceForecastStore {
  find(code: string): BounceForecast | undefined;
  save(item: BounceForecast): void;
  remove(code: string): boolean;
  list(): BounceForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBounceForecastStore implements BounceForecastStore {
  items: Map<string, BounceForecast>;
  order: string[];

  constructor(items: Map<string, BounceForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BounceForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BounceForecast): void {
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

  list(): BounceForecast[] {
    const out: BounceForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBounceForecastStore(): BounceForecastStore {
  return new MemoryBounceForecastStore(new Map<string, BounceForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBounceForecastStore implements BounceForecastStore {
  inner: BounceForecastStore;
  cache: cache.TtlCache<BounceForecast>;
  hits: number;
  misses: number;

  constructor(
    inner: BounceForecastStore,
    cacheValue: cache.TtlCache<BounceForecast>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BounceForecast | undefined {
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

  save(item: BounceForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BounceForecast[] {
    return this.inner.list();
  }
}

export function newCachedBounceForecastStore(inner: BounceForecastStore, ttl: number, clockValue: clock.Clock): BounceForecastStore {
  return new CachedBounceForecastStore(inner, cache.newTtlCache<BounceForecast>(1024, ttl, clockValue), 0, 0);
}

/** Selects bounce forecasts. Empty fields match all. */
export class BounceForecastQuery {
  label: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.label = label;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BounceForecast): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BounceForecast[]): BounceForecast[] {
    const matched = collections.filter(items, (candidate: BounceForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBounceForecasts(store: BounceForecastStore, query: BounceForecastQuery): BounceForecast[] {
  return query.apply(store.list());
}
