import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveInsightForecast } from "./adaptive-insight-forecast.js";

/** Keeps adaptive insight forecasts by code. */
export interface AdaptiveInsightForecastStore {
  find(code: string): AdaptiveInsightForecast | undefined;
  save(item: AdaptiveInsightForecast): void;
  remove(code: string): boolean;
  list(): AdaptiveInsightForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveInsightForecastStore implements AdaptiveInsightForecastStore {
  items: Map<string, AdaptiveInsightForecast>;
  order: string[];

  constructor(items: Map<string, AdaptiveInsightForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveInsightForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveInsightForecast): void {
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

  list(): AdaptiveInsightForecast[] {
    const out: AdaptiveInsightForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveInsightForecastStore(): AdaptiveInsightForecastStore {
  return new MemoryAdaptiveInsightForecastStore(new Map<string, AdaptiveInsightForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveInsightForecastStore implements AdaptiveInsightForecastStore {
  inner: AdaptiveInsightForecastStore;
  cache: cache.TtlCache<AdaptiveInsightForecast>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveInsightForecastStore,
    cacheValue: cache.TtlCache<AdaptiveInsightForecast>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveInsightForecast | undefined {
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

  save(item: AdaptiveInsightForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveInsightForecast[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveInsightForecastStore(inner: AdaptiveInsightForecastStore, ttl: number, clockValue: clock.Clock): AdaptiveInsightForecastStore {
  return new CachedAdaptiveInsightForecastStore(
    inner,
    cache.newTtlCache<AdaptiveInsightForecast>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive insight forecasts. Empty fields match all. */
export class AdaptiveInsightForecastQuery {
  channel: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minQuantity: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveInsightForecast): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveInsightForecast[]): AdaptiveInsightForecast[] {
    const matched = collections.filter(items, (candidate: AdaptiveInsightForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveInsightForecasts(store: AdaptiveInsightForecastStore, query: AdaptiveInsightForecastQuery): AdaptiveInsightForecast[] {
  return query.apply(store.list());
}
