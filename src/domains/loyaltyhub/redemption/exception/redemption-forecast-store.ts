import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RedemptionForecast } from "./redemption-forecast.js";

/** Keeps redemption forecasts by code. */
export interface RedemptionForecastStore {
  find(code: string): RedemptionForecast | undefined;
  save(item: RedemptionForecast): void;
  remove(code: string): boolean;
  list(): RedemptionForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRedemptionForecastStore implements RedemptionForecastStore {
  items: Map<string, RedemptionForecast>;
  order: string[];

  constructor(items: Map<string, RedemptionForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RedemptionForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RedemptionForecast): void {
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

  list(): RedemptionForecast[] {
    const out: RedemptionForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRedemptionForecastStore(): RedemptionForecastStore {
  return new MemoryRedemptionForecastStore(new Map<string, RedemptionForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRedemptionForecastStore implements RedemptionForecastStore {
  inner: RedemptionForecastStore;
  cache: cache.TtlCache<RedemptionForecast>;
  hits: number;
  misses: number;

  constructor(
    inner: RedemptionForecastStore,
    cacheValue: cache.TtlCache<RedemptionForecast>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RedemptionForecast | undefined {
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

  save(item: RedemptionForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RedemptionForecast[] {
    return this.inner.list();
  }
}

export function newCachedRedemptionForecastStore(inner: RedemptionForecastStore, ttl: number, clockValue: clock.Clock): RedemptionForecastStore {
  return new CachedRedemptionForecastStore(inner, cache.newTtlCache<RedemptionForecast>(128, ttl, clockValue), 0, 0);
}

/** Selects redemption forecasts. Empty fields match all. */
export class RedemptionForecastQuery {
  unit: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minMaximum: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RedemptionForecast): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RedemptionForecast[]): RedemptionForecast[] {
    const matched = collections.filter(items, (candidate: RedemptionForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRedemptionForecasts(store: RedemptionForecastStore, query: RedemptionForecastQuery): RedemptionForecast[] {
  return query.apply(store.list());
}
