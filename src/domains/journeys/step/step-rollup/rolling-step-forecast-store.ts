import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingStepForecast } from "./rolling-step-forecast.js";

/** Keeps rolling step forecasts by code. */
export interface RollingStepForecastStore {
  find(code: string): RollingStepForecast | undefined;
  save(item: RollingStepForecast): void;
  remove(code: string): boolean;
  list(): RollingStepForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingStepForecastStore implements RollingStepForecastStore {
  items: Map<string, RollingStepForecast>;
  order: string[];

  constructor(items: Map<string, RollingStepForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingStepForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingStepForecast): void {
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

  list(): RollingStepForecast[] {
    const out: RollingStepForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingStepForecastStore(): RollingStepForecastStore {
  return new MemoryRollingStepForecastStore(new Map<string, RollingStepForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingStepForecastStore implements RollingStepForecastStore {
  inner: RollingStepForecastStore;
  cache: cache.TtlCache<RollingStepForecast>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingStepForecastStore,
    cacheValue: cache.TtlCache<RollingStepForecast>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingStepForecast | undefined {
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

  save(item: RollingStepForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingStepForecast[] {
    return this.inner.list();
  }
}

export function newCachedRollingStepForecastStore(inner: RollingStepForecastStore, ttl: number, clockValue: clock.Clock): RollingStepForecastStore {
  return new CachedRollingStepForecastStore(inner, cache.newTtlCache<RollingStepForecast>(256, ttl, clockValue), 0, 0);
}

/** Selects rolling step forecasts. Empty fields match all. */
export class RollingStepForecastQuery {
  unit: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minCost: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingStepForecast): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingStepForecast[]): RollingStepForecast[] {
    const matched = collections.filter(items, (candidate: RollingStepForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingStepForecasts(store: RollingStepForecastStore, query: RollingStepForecastQuery): RollingStepForecast[] {
  return query.apply(store.list());
}
