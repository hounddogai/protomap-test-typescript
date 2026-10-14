import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedBadgeForecast } from "./capped-badge-forecast.js";

/** Keeps capped badge forecasts by code. */
export interface CappedBadgeForecastStore {
  find(code: string): CappedBadgeForecast | undefined;
  save(item: CappedBadgeForecast): void;
  remove(code: string): boolean;
  list(): CappedBadgeForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedBadgeForecastStore implements CappedBadgeForecastStore {
  items: Map<string, CappedBadgeForecast>;
  order: string[];

  constructor(items: Map<string, CappedBadgeForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedBadgeForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedBadgeForecast): void {
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

  list(): CappedBadgeForecast[] {
    const out: CappedBadgeForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedBadgeForecastStore(): CappedBadgeForecastStore {
  return new MemoryCappedBadgeForecastStore(new Map<string, CappedBadgeForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedBadgeForecastStore implements CappedBadgeForecastStore {
  inner: CappedBadgeForecastStore;
  cache: cache.TtlCache<CappedBadgeForecast>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedBadgeForecastStore,
    cacheValue: cache.TtlCache<CappedBadgeForecast>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedBadgeForecast | undefined {
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

  save(item: CappedBadgeForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedBadgeForecast[] {
    return this.inner.list();
  }
}

export function newCachedCappedBadgeForecastStore(inner: CappedBadgeForecastStore, ttl: number, clockValue: clock.Clock): CappedBadgeForecastStore {
  return new CachedCappedBadgeForecastStore(inner, cache.newTtlCache<CappedBadgeForecast>(128, ttl, clockValue), 0, 0);
}

/** Selects capped badge forecasts. Empty fields match all. */
export class CappedBadgeForecastQuery {
  locale: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minConversionRate: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedBadgeForecast): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedBadgeForecast[]): CappedBadgeForecast[] {
    const matched = collections.filter(items, (candidate: CappedBadgeForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedBadgeForecasts(store: CappedBadgeForecastStore, query: CappedBadgeForecastQuery): CappedBadgeForecast[] {
  return query.apply(store.list());
}
