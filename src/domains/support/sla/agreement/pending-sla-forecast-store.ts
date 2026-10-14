import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingSlaForecast } from "./pending-sla-forecast.js";

/** Keeps pending sla forecasts by code. */
export interface PendingSlaForecastStore {
  find(code: string): PendingSlaForecast | undefined;
  save(item: PendingSlaForecast): void;
  remove(code: string): boolean;
  list(): PendingSlaForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingSlaForecastStore implements PendingSlaForecastStore {
  items: Map<string, PendingSlaForecast>;
  order: string[];

  constructor(items: Map<string, PendingSlaForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingSlaForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingSlaForecast): void {
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

  list(): PendingSlaForecast[] {
    const out: PendingSlaForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingSlaForecastStore(): PendingSlaForecastStore {
  return new MemoryPendingSlaForecastStore(new Map<string, PendingSlaForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingSlaForecastStore implements PendingSlaForecastStore {
  inner: PendingSlaForecastStore;
  cache: cache.TtlCache<PendingSlaForecast>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingSlaForecastStore,
    cacheValue: cache.TtlCache<PendingSlaForecast>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingSlaForecast | undefined {
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

  save(item: PendingSlaForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingSlaForecast[] {
    return this.inner.list();
  }
}

export function newCachedPendingSlaForecastStore(inner: PendingSlaForecastStore, ttl: number, clockValue: clock.Clock): PendingSlaForecastStore {
  return new CachedPendingSlaForecastStore(inner, cache.newTtlCache<PendingSlaForecast>(64, ttl, clockValue), 0, 0);
}

/** Selects pending sla forecasts. Empty fields match all. */
export class PendingSlaForecastQuery {
  country: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minWeight: number, statuses: string[], limit: number) {
    this.country = country;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingSlaForecast): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingSlaForecast[]): PendingSlaForecast[] {
    const matched = collections.filter(items, (candidate: PendingSlaForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingSlaForecasts(store: PendingSlaForecastStore, query: PendingSlaForecastQuery): PendingSlaForecast[] {
  return query.apply(store.list());
}
