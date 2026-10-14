import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ConversionForecast } from "./conversion-forecast.js";

/** Keeps conversion forecasts by code. */
export interface ConversionForecastStore {
  find(code: string): ConversionForecast | undefined;
  save(item: ConversionForecast): void;
  remove(code: string): boolean;
  list(): ConversionForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryConversionForecastStore implements ConversionForecastStore {
  items: Map<string, ConversionForecast>;
  order: string[];

  constructor(items: Map<string, ConversionForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ConversionForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ConversionForecast): void {
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

  list(): ConversionForecast[] {
    const out: ConversionForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryConversionForecastStore(): ConversionForecastStore {
  return new MemoryConversionForecastStore(new Map<string, ConversionForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedConversionForecastStore implements ConversionForecastStore {
  inner: ConversionForecastStore;
  cache: cache.TtlCache<ConversionForecast>;
  hits: number;
  misses: number;

  constructor(
    inner: ConversionForecastStore,
    cacheValue: cache.TtlCache<ConversionForecast>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ConversionForecast | undefined {
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

  save(item: ConversionForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ConversionForecast[] {
    return this.inner.list();
  }
}

export function newCachedConversionForecastStore(inner: ConversionForecastStore, ttl: number, clockValue: clock.Clock): ConversionForecastStore {
  return new CachedConversionForecastStore(inner, cache.newTtlCache<ConversionForecast>(1024, ttl, clockValue), 0, 0);
}

/** Selects conversion forecasts. Empty fields match all. */
export class ConversionForecastQuery {
  source: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minCeiling: number, statuses: string[], limit: number) {
    this.source = source;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ConversionForecast): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ConversionForecast[]): ConversionForecast[] {
    const matched = collections.filter(items, (candidate: ConversionForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findConversionForecasts(store: ConversionForecastStore, query: ConversionForecastQuery): ConversionForecast[] {
  return query.apply(store.list());
}
