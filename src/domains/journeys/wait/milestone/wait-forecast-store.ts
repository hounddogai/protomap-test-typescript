import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WaitForecast } from "./wait-forecast.js";

/** Keeps wait forecasts by code. */
export interface WaitForecastStore {
  find(code: string): WaitForecast | undefined;
  save(item: WaitForecast): void;
  remove(code: string): boolean;
  list(): WaitForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWaitForecastStore implements WaitForecastStore {
  items: Map<string, WaitForecast>;
  order: string[];

  constructor(items: Map<string, WaitForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WaitForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WaitForecast): void {
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

  list(): WaitForecast[] {
    const out: WaitForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWaitForecastStore(): WaitForecastStore {
  return new MemoryWaitForecastStore(new Map<string, WaitForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWaitForecastStore implements WaitForecastStore {
  inner: WaitForecastStore;
  cache: cache.TtlCache<WaitForecast>;
  hits: number;
  misses: number;

  constructor(inner: WaitForecastStore, cacheValue: cache.TtlCache<WaitForecast>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WaitForecast | undefined {
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

  save(item: WaitForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WaitForecast[] {
    return this.inner.list();
  }
}

export function newCachedWaitForecastStore(inner: WaitForecastStore, ttl: number, clockValue: clock.Clock): WaitForecastStore {
  return new CachedWaitForecastStore(inner, cache.newTtlCache<WaitForecast>(128, ttl, clockValue), 0, 0);
}

/** Selects wait forecasts. Empty fields match all. */
export class WaitForecastQuery {
  title: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minAmount: number, statuses: string[], limit: number) {
    this.title = title;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WaitForecast): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WaitForecast[]): WaitForecast[] {
    const matched = collections.filter(items, (candidate: WaitForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWaitForecasts(store: WaitForecastStore, query: WaitForecastQuery): WaitForecast[] {
  return query.apply(store.list());
}
