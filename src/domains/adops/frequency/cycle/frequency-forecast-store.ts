import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FrequencyForecast } from "./frequency-forecast.js";

/** Keeps frequency forecasts by code. */
export interface FrequencyForecastStore {
  find(code: string): FrequencyForecast | undefined;
  save(item: FrequencyForecast): void;
  remove(code: string): boolean;
  list(): FrequencyForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFrequencyForecastStore implements FrequencyForecastStore {
  items: Map<string, FrequencyForecast>;
  order: string[];

  constructor(items: Map<string, FrequencyForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FrequencyForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FrequencyForecast): void {
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

  list(): FrequencyForecast[] {
    const out: FrequencyForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFrequencyForecastStore(): FrequencyForecastStore {
  return new MemoryFrequencyForecastStore(new Map<string, FrequencyForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFrequencyForecastStore implements FrequencyForecastStore {
  inner: FrequencyForecastStore;
  cache: cache.TtlCache<FrequencyForecast>;
  hits: number;
  misses: number;

  constructor(
    inner: FrequencyForecastStore,
    cacheValue: cache.TtlCache<FrequencyForecast>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FrequencyForecast | undefined {
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

  save(item: FrequencyForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FrequencyForecast[] {
    return this.inner.list();
  }
}

export function newCachedFrequencyForecastStore(inner: FrequencyForecastStore, ttl: number, clockValue: clock.Clock): FrequencyForecastStore {
  return new CachedFrequencyForecastStore(inner, cache.newTtlCache<FrequencyForecast>(512, ttl, clockValue), 0, 0);
}

/** Selects frequency forecasts. Empty fields match all. */
export class FrequencyForecastQuery {
  unit: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minMinimum: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FrequencyForecast): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FrequencyForecast[]): FrequencyForecast[] {
    const matched = collections.filter(items, (candidate: FrequencyForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFrequencyForecasts(store: FrequencyForecastStore, query: FrequencyForecastQuery): FrequencyForecast[] {
  return query.apply(store.list());
}
