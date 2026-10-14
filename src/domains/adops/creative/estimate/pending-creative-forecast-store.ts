import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingCreativeForecast } from "./pending-creative-forecast.js";

/** Keeps pending creative forecasts by code. */
export interface PendingCreativeForecastStore {
  find(code: string): PendingCreativeForecast | undefined;
  save(item: PendingCreativeForecast): void;
  remove(code: string): boolean;
  list(): PendingCreativeForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingCreativeForecastStore implements PendingCreativeForecastStore {
  items: Map<string, PendingCreativeForecast>;
  order: string[];

  constructor(items: Map<string, PendingCreativeForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingCreativeForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingCreativeForecast): void {
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

  list(): PendingCreativeForecast[] {
    const out: PendingCreativeForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingCreativeForecastStore(): PendingCreativeForecastStore {
  return new MemoryPendingCreativeForecastStore(new Map<string, PendingCreativeForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingCreativeForecastStore implements PendingCreativeForecastStore {
  inner: PendingCreativeForecastStore;
  cache: cache.TtlCache<PendingCreativeForecast>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingCreativeForecastStore,
    cacheValue: cache.TtlCache<PendingCreativeForecast>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingCreativeForecast | undefined {
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

  save(item: PendingCreativeForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingCreativeForecast[] {
    return this.inner.list();
  }
}

export function newCachedPendingCreativeForecastStore(inner: PendingCreativeForecastStore, ttl: number, clockValue: clock.Clock): PendingCreativeForecastStore {
  return new CachedPendingCreativeForecastStore(
    inner,
    cache.newTtlCache<PendingCreativeForecast>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending creative forecasts. Empty fields match all. */
export class PendingCreativeForecastQuery {
  source: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.source = source;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingCreativeForecast): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingCreativeForecast[]): PendingCreativeForecast[] {
    const matched = collections.filter(items, (candidate: PendingCreativeForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingCreativeForecasts(store: PendingCreativeForecastStore, query: PendingCreativeForecastQuery): PendingCreativeForecast[] {
  return query.apply(store.list());
}
