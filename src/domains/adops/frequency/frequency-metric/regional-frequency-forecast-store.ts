import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalFrequencyForecast } from "./regional-frequency-forecast.js";

/** Keeps regional frequency forecasts by code. */
export interface RegionalFrequencyForecastStore {
  find(code: string): RegionalFrequencyForecast | undefined;
  save(item: RegionalFrequencyForecast): void;
  remove(code: string): boolean;
  list(): RegionalFrequencyForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalFrequencyForecastStore implements RegionalFrequencyForecastStore {
  items: Map<string, RegionalFrequencyForecast>;
  order: string[];

  constructor(items: Map<string, RegionalFrequencyForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalFrequencyForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalFrequencyForecast): void {
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

  list(): RegionalFrequencyForecast[] {
    const out: RegionalFrequencyForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalFrequencyForecastStore(): RegionalFrequencyForecastStore {
  return new MemoryRegionalFrequencyForecastStore(new Map<string, RegionalFrequencyForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalFrequencyForecastStore implements RegionalFrequencyForecastStore {
  inner: RegionalFrequencyForecastStore;
  cache: cache.TtlCache<RegionalFrequencyForecast>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalFrequencyForecastStore,
    cacheValue: cache.TtlCache<RegionalFrequencyForecast>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalFrequencyForecast | undefined {
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

  save(item: RegionalFrequencyForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalFrequencyForecast[] {
    return this.inner.list();
  }
}

export function newCachedRegionalFrequencyForecastStore(inner: RegionalFrequencyForecastStore, ttl: number, clockValue: clock.Clock): RegionalFrequencyForecastStore {
  return new CachedRegionalFrequencyForecastStore(
    inner,
    cache.newTtlCache<RegionalFrequencyForecast>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional frequency forecasts. Empty fields match all. */
export class RegionalFrequencyForecastQuery {
  country: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minRate: number, statuses: string[], limit: number) {
    this.country = country;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalFrequencyForecast): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalFrequencyForecast[]): RegionalFrequencyForecast[] {
    const matched = collections.filter(items, (candidate: RegionalFrequencyForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalFrequencyForecasts(store: RegionalFrequencyForecastStore, query: RegionalFrequencyForecastQuery): RegionalFrequencyForecast[] {
  return query.apply(store.list());
}
