import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ComplaintForecast } from "./complaint-forecast.js";

/** Keeps complaint forecasts by code. */
export interface ComplaintForecastStore {
  find(code: string): ComplaintForecast | undefined;
  save(item: ComplaintForecast): void;
  remove(code: string): boolean;
  list(): ComplaintForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryComplaintForecastStore implements ComplaintForecastStore {
  items: Map<string, ComplaintForecast>;
  order: string[];

  constructor(items: Map<string, ComplaintForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ComplaintForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ComplaintForecast): void {
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

  list(): ComplaintForecast[] {
    const out: ComplaintForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryComplaintForecastStore(): ComplaintForecastStore {
  return new MemoryComplaintForecastStore(new Map<string, ComplaintForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedComplaintForecastStore implements ComplaintForecastStore {
  inner: ComplaintForecastStore;
  cache: cache.TtlCache<ComplaintForecast>;
  hits: number;
  misses: number;

  constructor(
    inner: ComplaintForecastStore,
    cacheValue: cache.TtlCache<ComplaintForecast>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ComplaintForecast | undefined {
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

  save(item: ComplaintForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ComplaintForecast[] {
    return this.inner.list();
  }
}

export function newCachedComplaintForecastStore(inner: ComplaintForecastStore, ttl: number, clockValue: clock.Clock): ComplaintForecastStore {
  return new CachedComplaintForecastStore(inner, cache.newTtlCache<ComplaintForecast>(512, ttl, clockValue), 0, 0);
}

/** Selects complaint forecasts. Empty fields match all. */
export class ComplaintForecastQuery {
  unit: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minRetries: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ComplaintForecast): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ComplaintForecast[]): ComplaintForecast[] {
    const matched = collections.filter(items, (candidate: ComplaintForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findComplaintForecasts(store: ComplaintForecastStore, query: ComplaintForecastQuery): ComplaintForecast[] {
  return query.apply(store.list());
}
