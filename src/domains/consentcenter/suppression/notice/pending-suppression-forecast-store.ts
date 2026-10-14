import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingSuppressionForecast } from "./pending-suppression-forecast.js";

/** Keeps pending suppression forecasts by code. */
export interface PendingSuppressionForecastStore {
  find(code: string): PendingSuppressionForecast | undefined;
  save(item: PendingSuppressionForecast): void;
  remove(code: string): boolean;
  list(): PendingSuppressionForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingSuppressionForecastStore implements PendingSuppressionForecastStore {
  items: Map<string, PendingSuppressionForecast>;
  order: string[];

  constructor(items: Map<string, PendingSuppressionForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingSuppressionForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingSuppressionForecast): void {
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

  list(): PendingSuppressionForecast[] {
    const out: PendingSuppressionForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingSuppressionForecastStore(): PendingSuppressionForecastStore {
  return new MemoryPendingSuppressionForecastStore(new Map<string, PendingSuppressionForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingSuppressionForecastStore implements PendingSuppressionForecastStore {
  inner: PendingSuppressionForecastStore;
  cache: cache.TtlCache<PendingSuppressionForecast>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingSuppressionForecastStore,
    cacheValue: cache.TtlCache<PendingSuppressionForecast>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingSuppressionForecast | undefined {
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

  save(item: PendingSuppressionForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingSuppressionForecast[] {
    return this.inner.list();
  }
}

export function newCachedPendingSuppressionForecastStore(inner: PendingSuppressionForecastStore, ttl: number, clockValue: clock.Clock): PendingSuppressionForecastStore {
  return new CachedPendingSuppressionForecastStore(
    inner,
    cache.newTtlCache<PendingSuppressionForecast>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending suppression forecasts. Empty fields match all. */
export class PendingSuppressionForecastQuery {
  unit: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minCeiling: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingSuppressionForecast): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingSuppressionForecast[]): PendingSuppressionForecast[] {
    const matched = collections.filter(items, (candidate: PendingSuppressionForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingSuppressionForecasts(store: PendingSuppressionForecastStore, query: PendingSuppressionForecastQuery): PendingSuppressionForecast[] {
  return query.apply(store.list());
}
