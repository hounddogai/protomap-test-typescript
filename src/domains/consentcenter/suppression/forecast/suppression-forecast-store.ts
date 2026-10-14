import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SuppressionForecast } from "./suppression-forecast.js";

/** Keeps suppression forecasts by code. */
export interface SuppressionForecastStore {
  find(code: string): SuppressionForecast | undefined;
  save(item: SuppressionForecast): void;
  remove(code: string): boolean;
  list(): SuppressionForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySuppressionForecastStore implements SuppressionForecastStore {
  items: Map<string, SuppressionForecast>;
  order: string[];

  constructor(items: Map<string, SuppressionForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SuppressionForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SuppressionForecast): void {
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

  list(): SuppressionForecast[] {
    const out: SuppressionForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySuppressionForecastStore(): SuppressionForecastStore {
  return new MemorySuppressionForecastStore(new Map<string, SuppressionForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSuppressionForecastStore implements SuppressionForecastStore {
  inner: SuppressionForecastStore;
  cache: cache.TtlCache<SuppressionForecast>;
  hits: number;
  misses: number;

  constructor(
    inner: SuppressionForecastStore,
    cacheValue: cache.TtlCache<SuppressionForecast>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SuppressionForecast | undefined {
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

  save(item: SuppressionForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SuppressionForecast[] {
    return this.inner.list();
  }
}

export function newCachedSuppressionForecastStore(inner: SuppressionForecastStore, ttl: number, clockValue: clock.Clock): SuppressionForecastStore {
  return new CachedSuppressionForecastStore(inner, cache.newTtlCache<SuppressionForecast>(128, ttl, clockValue), 0, 0);
}

/** Selects suppression forecasts. Empty fields match all. */
export class SuppressionForecastQuery {
  category: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minSequence: number, statuses: string[], limit: number) {
    this.category = category;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SuppressionForecast): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SuppressionForecast[]): SuppressionForecast[] {
    const matched = collections.filter(items, (candidate: SuppressionForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSuppressionForecasts(store: SuppressionForecastStore, query: SuppressionForecastQuery): SuppressionForecast[] {
  return query.apply(store.list());
}
