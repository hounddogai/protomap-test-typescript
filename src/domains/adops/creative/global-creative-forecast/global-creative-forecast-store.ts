import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalCreativeForecast } from "./global-creative-forecast.js";

/** Keeps global creative forecasts by code. */
export interface GlobalCreativeForecastStore {
  find(code: string): GlobalCreativeForecast | undefined;
  save(item: GlobalCreativeForecast): void;
  remove(code: string): boolean;
  list(): GlobalCreativeForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalCreativeForecastStore implements GlobalCreativeForecastStore {
  items: Map<string, GlobalCreativeForecast>;
  order: string[];

  constructor(items: Map<string, GlobalCreativeForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalCreativeForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalCreativeForecast): void {
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

  list(): GlobalCreativeForecast[] {
    const out: GlobalCreativeForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalCreativeForecastStore(): GlobalCreativeForecastStore {
  return new MemoryGlobalCreativeForecastStore(new Map<string, GlobalCreativeForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalCreativeForecastStore implements GlobalCreativeForecastStore {
  inner: GlobalCreativeForecastStore;
  cache: cache.TtlCache<GlobalCreativeForecast>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalCreativeForecastStore,
    cacheValue: cache.TtlCache<GlobalCreativeForecast>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalCreativeForecast | undefined {
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

  save(item: GlobalCreativeForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalCreativeForecast[] {
    return this.inner.list();
  }
}

export function newCachedGlobalCreativeForecastStore(inner: GlobalCreativeForecastStore, ttl: number, clockValue: clock.Clock): GlobalCreativeForecastStore {
  return new CachedGlobalCreativeForecastStore(
    inner,
    cache.newTtlCache<GlobalCreativeForecast>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects global creative forecasts. Empty fields match all. */
export class GlobalCreativeForecastQuery {
  region: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minGraceDays: number, statuses: string[], limit: number) {
    this.region = region;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalCreativeForecast): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalCreativeForecast[]): GlobalCreativeForecast[] {
    const matched = collections.filter(items, (candidate: GlobalCreativeForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalCreativeForecasts(store: GlobalCreativeForecastStore, query: GlobalCreativeForecastQuery): GlobalCreativeForecast[] {
  return query.apply(store.list());
}
