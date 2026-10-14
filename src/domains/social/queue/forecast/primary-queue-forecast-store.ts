import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryQueueForecast } from "./primary-queue-forecast.js";

/** Keeps primary queue forecasts by code. */
export interface PrimaryQueueForecastStore {
  find(code: string): PrimaryQueueForecast | undefined;
  save(item: PrimaryQueueForecast): void;
  remove(code: string): boolean;
  list(): PrimaryQueueForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryQueueForecastStore implements PrimaryQueueForecastStore {
  items: Map<string, PrimaryQueueForecast>;
  order: string[];

  constructor(items: Map<string, PrimaryQueueForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryQueueForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryQueueForecast): void {
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

  list(): PrimaryQueueForecast[] {
    const out: PrimaryQueueForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryQueueForecastStore(): PrimaryQueueForecastStore {
  return new MemoryPrimaryQueueForecastStore(new Map<string, PrimaryQueueForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryQueueForecastStore implements PrimaryQueueForecastStore {
  inner: PrimaryQueueForecastStore;
  cache: cache.TtlCache<PrimaryQueueForecast>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryQueueForecastStore,
    cacheValue: cache.TtlCache<PrimaryQueueForecast>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryQueueForecast | undefined {
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

  save(item: PrimaryQueueForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryQueueForecast[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryQueueForecastStore(inner: PrimaryQueueForecastStore, ttl: number, clockValue: clock.Clock): PrimaryQueueForecastStore {
  return new CachedPrimaryQueueForecastStore(
    inner,
    cache.newTtlCache<PrimaryQueueForecast>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary queue forecasts. Empty fields match all. */
export class PrimaryQueueForecastQuery {
  locale: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minStartsAt: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryQueueForecast): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryQueueForecast[]): PrimaryQueueForecast[] {
    const matched = collections.filter(items, (candidate: PrimaryQueueForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryQueueForecasts(store: PrimaryQueueForecastStore, query: PrimaryQueueForecastQuery): PrimaryQueueForecast[] {
  return query.apply(store.list());
}
