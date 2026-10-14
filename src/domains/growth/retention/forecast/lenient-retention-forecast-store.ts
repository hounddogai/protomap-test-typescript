import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientRetentionForecast } from "./lenient-retention-forecast.js";

/** Keeps lenient retention forecasts by code. */
export interface LenientRetentionForecastStore {
  find(code: string): LenientRetentionForecast | undefined;
  save(item: LenientRetentionForecast): void;
  remove(code: string): boolean;
  list(): LenientRetentionForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientRetentionForecastStore implements LenientRetentionForecastStore {
  items: Map<string, LenientRetentionForecast>;
  order: string[];

  constructor(items: Map<string, LenientRetentionForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientRetentionForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientRetentionForecast): void {
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

  list(): LenientRetentionForecast[] {
    const out: LenientRetentionForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientRetentionForecastStore(): LenientRetentionForecastStore {
  return new MemoryLenientRetentionForecastStore(new Map<string, LenientRetentionForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientRetentionForecastStore implements LenientRetentionForecastStore {
  inner: LenientRetentionForecastStore;
  cache: cache.TtlCache<LenientRetentionForecast>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientRetentionForecastStore,
    cacheValue: cache.TtlCache<LenientRetentionForecast>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientRetentionForecast | undefined {
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

  save(item: LenientRetentionForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientRetentionForecast[] {
    return this.inner.list();
  }
}

export function newCachedLenientRetentionForecastStore(inner: LenientRetentionForecastStore, ttl: number, clockValue: clock.Clock): LenientRetentionForecastStore {
  return new CachedLenientRetentionForecastStore(
    inner,
    cache.newTtlCache<LenientRetentionForecast>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient retention forecasts. Empty fields match all. */
export class LenientRetentionForecastQuery {
  segment: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minFloorValue: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientRetentionForecast): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientRetentionForecast[]): LenientRetentionForecast[] {
    const matched = collections.filter(items, (candidate: LenientRetentionForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientRetentionForecasts(store: LenientRetentionForecastStore, query: LenientRetentionForecastQuery): LenientRetentionForecast[] {
  return query.apply(store.list());
}
