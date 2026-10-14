import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { QueueForecast } from "./queue-forecast.js";

/** Keeps queue forecasts by code. */
export interface QueueForecastStore {
  find(code: string): QueueForecast | undefined;
  save(item: QueueForecast): void;
  remove(code: string): boolean;
  list(): QueueForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryQueueForecastStore implements QueueForecastStore {
  items: Map<string, QueueForecast>;
  order: string[];

  constructor(items: Map<string, QueueForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): QueueForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: QueueForecast): void {
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

  list(): QueueForecast[] {
    const out: QueueForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryQueueForecastStore(): QueueForecastStore {
  return new MemoryQueueForecastStore(new Map<string, QueueForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedQueueForecastStore implements QueueForecastStore {
  inner: QueueForecastStore;
  cache: cache.TtlCache<QueueForecast>;
  hits: number;
  misses: number;

  constructor(inner: QueueForecastStore, cacheValue: cache.TtlCache<QueueForecast>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): QueueForecast | undefined {
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

  save(item: QueueForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): QueueForecast[] {
    return this.inner.list();
  }
}

export function newCachedQueueForecastStore(inner: QueueForecastStore, ttl: number, clockValue: clock.Clock): QueueForecastStore {
  return new CachedQueueForecastStore(inner, cache.newTtlCache<QueueForecast>(128, ttl, clockValue), 0, 0);
}

/** Selects queue forecasts. Empty fields match all. */
export class QueueForecastQuery {
  region: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minCapacity: number, statuses: string[], limit: number) {
    this.region = region;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: QueueForecast): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: QueueForecast[]): QueueForecast[] {
    const matched = collections.filter(items, (candidate: QueueForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findQueueForecasts(store: QueueForecastStore, query: QueueForecastQuery): QueueForecast[] {
  return query.apply(store.list());
}
