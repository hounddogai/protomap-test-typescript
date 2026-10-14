import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ModelForecast } from "./model-forecast.js";

/** Keeps model forecasts by code. */
export interface ModelForecastStore {
  find(code: string): ModelForecast | undefined;
  save(item: ModelForecast): void;
  remove(code: string): boolean;
  list(): ModelForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryModelForecastStore implements ModelForecastStore {
  items: Map<string, ModelForecast>;
  order: string[];

  constructor(items: Map<string, ModelForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ModelForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ModelForecast): void {
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

  list(): ModelForecast[] {
    const out: ModelForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryModelForecastStore(): ModelForecastStore {
  return new MemoryModelForecastStore(new Map<string, ModelForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedModelForecastStore implements ModelForecastStore {
  inner: ModelForecastStore;
  cache: cache.TtlCache<ModelForecast>;
  hits: number;
  misses: number;

  constructor(inner: ModelForecastStore, cacheValue: cache.TtlCache<ModelForecast>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ModelForecast | undefined {
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

  save(item: ModelForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ModelForecast[] {
    return this.inner.list();
  }
}

export function newCachedModelForecastStore(inner: ModelForecastStore, ttl: number, clockValue: clock.Clock): ModelForecastStore {
  return new CachedModelForecastStore(inner, cache.newTtlCache<ModelForecast>(1024, ttl, clockValue), 0, 0);
}

/** Selects model forecasts. Empty fields match all. */
export class ModelForecastQuery {
  locale: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minScore: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ModelForecast): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ModelForecast[]): ModelForecast[] {
    const matched = collections.filter(items, (candidate: ModelForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findModelForecasts(store: ModelForecastStore, query: ModelForecastQuery): ModelForecast[] {
  return query.apply(store.list());
}
