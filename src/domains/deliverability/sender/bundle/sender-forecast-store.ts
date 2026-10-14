import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SenderForecast } from "./sender-forecast.js";

/** Keeps sender forecasts by code. */
export interface SenderForecastStore {
  find(code: string): SenderForecast | undefined;
  save(item: SenderForecast): void;
  remove(code: string): boolean;
  list(): SenderForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySenderForecastStore implements SenderForecastStore {
  items: Map<string, SenderForecast>;
  order: string[];

  constructor(items: Map<string, SenderForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SenderForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SenderForecast): void {
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

  list(): SenderForecast[] {
    const out: SenderForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySenderForecastStore(): SenderForecastStore {
  return new MemorySenderForecastStore(new Map<string, SenderForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSenderForecastStore implements SenderForecastStore {
  inner: SenderForecastStore;
  cache: cache.TtlCache<SenderForecast>;
  hits: number;
  misses: number;

  constructor(
    inner: SenderForecastStore,
    cacheValue: cache.TtlCache<SenderForecast>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SenderForecast | undefined {
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

  save(item: SenderForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SenderForecast[] {
    return this.inner.list();
  }
}

export function newCachedSenderForecastStore(inner: SenderForecastStore, ttl: number, clockValue: clock.Clock): SenderForecastStore {
  return new CachedSenderForecastStore(inner, cache.newTtlCache<SenderForecast>(1024, ttl, clockValue), 0, 0);
}

/** Selects sender forecasts. Empty fields match all. */
export class SenderForecastQuery {
  channel: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minAmount: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SenderForecast): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SenderForecast[]): SenderForecast[] {
    const matched = collections.filter(items, (candidate: SenderForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSenderForecasts(store: SenderForecastStore, query: SenderForecastQuery): SenderForecast[] {
  return query.apply(store.list());
}
