import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CohortForecast } from "./cohort-forecast.js";

/** Keeps cohort forecasts by code. */
export interface CohortForecastStore {
  find(code: string): CohortForecast | undefined;
  save(item: CohortForecast): void;
  remove(code: string): boolean;
  list(): CohortForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCohortForecastStore implements CohortForecastStore {
  items: Map<string, CohortForecast>;
  order: string[];

  constructor(items: Map<string, CohortForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CohortForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CohortForecast): void {
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

  list(): CohortForecast[] {
    const out: CohortForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCohortForecastStore(): CohortForecastStore {
  return new MemoryCohortForecastStore(new Map<string, CohortForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCohortForecastStore implements CohortForecastStore {
  inner: CohortForecastStore;
  cache: cache.TtlCache<CohortForecast>;
  hits: number;
  misses: number;

  constructor(
    inner: CohortForecastStore,
    cacheValue: cache.TtlCache<CohortForecast>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CohortForecast | undefined {
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

  save(item: CohortForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CohortForecast[] {
    return this.inner.list();
  }
}

export function newCachedCohortForecastStore(inner: CohortForecastStore, ttl: number, clockValue: clock.Clock): CohortForecastStore {
  return new CachedCohortForecastStore(inner, cache.newTtlCache<CohortForecast>(128, ttl, clockValue), 0, 0);
}

/** Selects cohort forecasts. Empty fields match all. */
export class CohortForecastQuery {
  region: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minBudget: number, statuses: string[], limit: number) {
    this.region = region;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CohortForecast): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CohortForecast[]): CohortForecast[] {
    const matched = collections.filter(items, (candidate: CohortForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCohortForecasts(store: CohortForecastStore, query: CohortForecastQuery): CohortForecast[] {
  return query.apply(store.list());
}
