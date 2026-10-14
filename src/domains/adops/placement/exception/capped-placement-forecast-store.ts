import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedPlacementForecast } from "./capped-placement-forecast.js";

/** Keeps capped placement forecasts by code. */
export interface CappedPlacementForecastStore {
  find(code: string): CappedPlacementForecast | undefined;
  save(item: CappedPlacementForecast): void;
  remove(code: string): boolean;
  list(): CappedPlacementForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedPlacementForecastStore implements CappedPlacementForecastStore {
  items: Map<string, CappedPlacementForecast>;
  order: string[];

  constructor(items: Map<string, CappedPlacementForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedPlacementForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedPlacementForecast): void {
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

  list(): CappedPlacementForecast[] {
    const out: CappedPlacementForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedPlacementForecastStore(): CappedPlacementForecastStore {
  return new MemoryCappedPlacementForecastStore(new Map<string, CappedPlacementForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedPlacementForecastStore implements CappedPlacementForecastStore {
  inner: CappedPlacementForecastStore;
  cache: cache.TtlCache<CappedPlacementForecast>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedPlacementForecastStore,
    cacheValue: cache.TtlCache<CappedPlacementForecast>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedPlacementForecast | undefined {
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

  save(item: CappedPlacementForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedPlacementForecast[] {
    return this.inner.list();
  }
}

export function newCachedCappedPlacementForecastStore(inner: CappedPlacementForecastStore, ttl: number, clockValue: clock.Clock): CappedPlacementForecastStore {
  return new CachedCappedPlacementForecastStore(
    inner,
    cache.newTtlCache<CappedPlacementForecast>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects capped placement forecasts. Empty fields match all. */
export class CappedPlacementForecastQuery {
  title: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minBudget: number, statuses: string[], limit: number) {
    this.title = title;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedPlacementForecast): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedPlacementForecast[]): CappedPlacementForecast[] {
    const matched = collections.filter(items, (candidate: CappedPlacementForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedPlacementForecasts(store: CappedPlacementForecastStore, query: CappedPlacementForecastQuery): CappedPlacementForecast[] {
  return query.apply(store.list());
}
