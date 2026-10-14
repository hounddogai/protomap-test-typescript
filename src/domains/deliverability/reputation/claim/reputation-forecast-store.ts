import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ReputationForecast } from "./reputation-forecast.js";

/** Keeps reputation forecasts by code. */
export interface ReputationForecastStore {
  find(code: string): ReputationForecast | undefined;
  save(item: ReputationForecast): void;
  remove(code: string): boolean;
  list(): ReputationForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryReputationForecastStore implements ReputationForecastStore {
  items: Map<string, ReputationForecast>;
  order: string[];

  constructor(items: Map<string, ReputationForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ReputationForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ReputationForecast): void {
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

  list(): ReputationForecast[] {
    const out: ReputationForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryReputationForecastStore(): ReputationForecastStore {
  return new MemoryReputationForecastStore(new Map<string, ReputationForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedReputationForecastStore implements ReputationForecastStore {
  inner: ReputationForecastStore;
  cache: cache.TtlCache<ReputationForecast>;
  hits: number;
  misses: number;

  constructor(
    inner: ReputationForecastStore,
    cacheValue: cache.TtlCache<ReputationForecast>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ReputationForecast | undefined {
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

  save(item: ReputationForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ReputationForecast[] {
    return this.inner.list();
  }
}

export function newCachedReputationForecastStore(inner: ReputationForecastStore, ttl: number, clockValue: clock.Clock): ReputationForecastStore {
  return new CachedReputationForecastStore(inner, cache.newTtlCache<ReputationForecast>(256, ttl, clockValue), 0, 0);
}

/** Selects reputation forecasts. Empty fields match all. */
export class ReputationForecastQuery {
  locale: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minBatchSize: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ReputationForecast): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ReputationForecast[]): ReputationForecast[] {
    const matched = collections.filter(items, (candidate: ReputationForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findReputationForecasts(store: ReputationForecastStore, query: ReputationForecastQuery): ReputationForecast[] {
  return query.apply(store.list());
}
