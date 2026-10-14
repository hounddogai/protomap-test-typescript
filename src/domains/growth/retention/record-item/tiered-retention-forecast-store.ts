import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredRetentionForecast } from "./tiered-retention-forecast.js";

/** Keeps tiered retention forecasts by code. */
export interface TieredRetentionForecastStore {
  find(code: string): TieredRetentionForecast | undefined;
  save(item: TieredRetentionForecast): void;
  remove(code: string): boolean;
  list(): TieredRetentionForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredRetentionForecastStore implements TieredRetentionForecastStore {
  items: Map<string, TieredRetentionForecast>;
  order: string[];

  constructor(items: Map<string, TieredRetentionForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredRetentionForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredRetentionForecast): void {
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

  list(): TieredRetentionForecast[] {
    const out: TieredRetentionForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredRetentionForecastStore(): TieredRetentionForecastStore {
  return new MemoryTieredRetentionForecastStore(new Map<string, TieredRetentionForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredRetentionForecastStore implements TieredRetentionForecastStore {
  inner: TieredRetentionForecastStore;
  cache: cache.TtlCache<TieredRetentionForecast>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredRetentionForecastStore,
    cacheValue: cache.TtlCache<TieredRetentionForecast>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredRetentionForecast | undefined {
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

  save(item: TieredRetentionForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredRetentionForecast[] {
    return this.inner.list();
  }
}

export function newCachedTieredRetentionForecastStore(inner: TieredRetentionForecastStore, ttl: number, clockValue: clock.Clock): TieredRetentionForecastStore {
  return new CachedTieredRetentionForecastStore(
    inner,
    cache.newTtlCache<TieredRetentionForecast>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered retention forecasts. Empty fields match all. */
export class TieredRetentionForecastQuery {
  region: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minAttempts: number, statuses: string[], limit: number) {
    this.region = region;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredRetentionForecast): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredRetentionForecast[]): TieredRetentionForecast[] {
    const matched = collections.filter(items, (candidate: TieredRetentionForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredRetentionForecasts(store: TieredRetentionForecastStore, query: TieredRetentionForecastQuery): TieredRetentionForecast[] {
  return query.apply(store.list());
}
