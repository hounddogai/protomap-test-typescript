import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DomainForecast } from "./domain-forecast.js";

/** Keeps domain forecasts by code. */
export interface DomainForecastStore {
  find(code: string): DomainForecast | undefined;
  save(item: DomainForecast): void;
  remove(code: string): boolean;
  list(): DomainForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDomainForecastStore implements DomainForecastStore {
  items: Map<string, DomainForecast>;
  order: string[];

  constructor(items: Map<string, DomainForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DomainForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DomainForecast): void {
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

  list(): DomainForecast[] {
    const out: DomainForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDomainForecastStore(): DomainForecastStore {
  return new MemoryDomainForecastStore(new Map<string, DomainForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDomainForecastStore implements DomainForecastStore {
  inner: DomainForecastStore;
  cache: cache.TtlCache<DomainForecast>;
  hits: number;
  misses: number;

  constructor(
    inner: DomainForecastStore,
    cacheValue: cache.TtlCache<DomainForecast>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DomainForecast | undefined {
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

  save(item: DomainForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DomainForecast[] {
    return this.inner.list();
  }
}

export function newCachedDomainForecastStore(inner: DomainForecastStore, ttl: number, clockValue: clock.Clock): DomainForecastStore {
  return new CachedDomainForecastStore(inner, cache.newTtlCache<DomainForecast>(1024, ttl, clockValue), 0, 0);
}

/** Selects domain forecasts. Empty fields match all. */
export class DomainForecastQuery {
  region: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minLimit: number, statuses: string[], limit: number) {
    this.region = region;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DomainForecast): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DomainForecast[]): DomainForecast[] {
    const matched = collections.filter(items, (candidate: DomainForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDomainForecasts(store: DomainForecastStore, query: DomainForecastQuery): DomainForecast[] {
  return query.apply(store.list());
}
