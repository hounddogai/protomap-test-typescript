import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryTierForecast } from "./primary-tier-forecast.js";

/** Keeps primary tier forecasts by code. */
export interface PrimaryTierForecastStore {
  find(code: string): PrimaryTierForecast | undefined;
  save(item: PrimaryTierForecast): void;
  remove(code: string): boolean;
  list(): PrimaryTierForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryTierForecastStore implements PrimaryTierForecastStore {
  items: Map<string, PrimaryTierForecast>;
  order: string[];

  constructor(items: Map<string, PrimaryTierForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryTierForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryTierForecast): void {
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

  list(): PrimaryTierForecast[] {
    const out: PrimaryTierForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryTierForecastStore(): PrimaryTierForecastStore {
  return new MemoryPrimaryTierForecastStore(new Map<string, PrimaryTierForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryTierForecastStore implements PrimaryTierForecastStore {
  inner: PrimaryTierForecastStore;
  cache: cache.TtlCache<PrimaryTierForecast>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryTierForecastStore,
    cacheValue: cache.TtlCache<PrimaryTierForecast>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryTierForecast | undefined {
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

  save(item: PrimaryTierForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryTierForecast[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryTierForecastStore(inner: PrimaryTierForecastStore, ttl: number, clockValue: clock.Clock): PrimaryTierForecastStore {
  return new CachedPrimaryTierForecastStore(inner, cache.newTtlCache<PrimaryTierForecast>(128, ttl, clockValue), 0, 0);
}

/** Selects primary tier forecasts. Empty fields match all. */
export class PrimaryTierForecastQuery {
  utmSource: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minSendAt: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryTierForecast): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryTierForecast[]): PrimaryTierForecast[] {
    const matched = collections.filter(items, (candidate: PrimaryTierForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryTierForecasts(store: PrimaryTierForecastStore, query: PrimaryTierForecastQuery): PrimaryTierForecast[] {
  return query.apply(store.list());
}
