import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredTierForecast } from "./tiered-tier-forecast.js";

/** Keeps tiered tier forecasts by code. */
export interface TieredTierForecastStore {
  find(code: string): TieredTierForecast | undefined;
  save(item: TieredTierForecast): void;
  remove(code: string): boolean;
  list(): TieredTierForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredTierForecastStore implements TieredTierForecastStore {
  items: Map<string, TieredTierForecast>;
  order: string[];

  constructor(items: Map<string, TieredTierForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredTierForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredTierForecast): void {
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

  list(): TieredTierForecast[] {
    const out: TieredTierForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredTierForecastStore(): TieredTierForecastStore {
  return new MemoryTieredTierForecastStore(new Map<string, TieredTierForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredTierForecastStore implements TieredTierForecastStore {
  inner: TieredTierForecastStore;
  cache: cache.TtlCache<TieredTierForecast>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredTierForecastStore,
    cacheValue: cache.TtlCache<TieredTierForecast>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredTierForecast | undefined {
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

  save(item: TieredTierForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredTierForecast[] {
    return this.inner.list();
  }
}

export function newCachedTieredTierForecastStore(inner: TieredTierForecastStore, ttl: number, clockValue: clock.Clock): TieredTierForecastStore {
  return new CachedTieredTierForecastStore(inner, cache.newTtlCache<TieredTierForecast>(512, ttl, clockValue), 0, 0);
}

/** Selects tiered tier forecasts. Empty fields match all. */
export class TieredTierForecastQuery {
  name: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minRetries: number, statuses: string[], limit: number) {
    this.name = name;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredTierForecast): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredTierForecast[]): TieredTierForecast[] {
    const matched = collections.filter(items, (candidate: TieredTierForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredTierForecasts(store: TieredTierForecastStore, query: TieredTierForecastQuery): TieredTierForecast[] {
  return query.apply(store.list());
}
