import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedPreferenceForecast } from "./batched-preference-forecast.js";

/** Keeps batched preference forecasts by code. */
export interface BatchedPreferenceForecastStore {
  find(code: string): BatchedPreferenceForecast | undefined;
  save(item: BatchedPreferenceForecast): void;
  remove(code: string): boolean;
  list(): BatchedPreferenceForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedPreferenceForecastStore implements BatchedPreferenceForecastStore {
  items: Map<string, BatchedPreferenceForecast>;
  order: string[];

  constructor(items: Map<string, BatchedPreferenceForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedPreferenceForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedPreferenceForecast): void {
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

  list(): BatchedPreferenceForecast[] {
    const out: BatchedPreferenceForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedPreferenceForecastStore(): BatchedPreferenceForecastStore {
  return new MemoryBatchedPreferenceForecastStore(new Map<string, BatchedPreferenceForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedPreferenceForecastStore implements BatchedPreferenceForecastStore {
  inner: BatchedPreferenceForecastStore;
  cache: cache.TtlCache<BatchedPreferenceForecast>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedPreferenceForecastStore,
    cacheValue: cache.TtlCache<BatchedPreferenceForecast>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedPreferenceForecast | undefined {
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

  save(item: BatchedPreferenceForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedPreferenceForecast[] {
    return this.inner.list();
  }
}

export function newCachedBatchedPreferenceForecastStore(inner: BatchedPreferenceForecastStore, ttl: number, clockValue: clock.Clock): BatchedPreferenceForecastStore {
  return new CachedBatchedPreferenceForecastStore(
    inner,
    cache.newTtlCache<BatchedPreferenceForecast>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched preference forecasts. Empty fields match all. */
export class BatchedPreferenceForecastQuery {
  segment: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minVersion: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedPreferenceForecast): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedPreferenceForecast[]): BatchedPreferenceForecast[] {
    const matched = collections.filter(items, (candidate: BatchedPreferenceForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedPreferenceForecasts(store: BatchedPreferenceForecastStore, query: BatchedPreferenceForecastQuery): BatchedPreferenceForecast[] {
  return query.apply(store.list());
}
