import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LevelForecast } from "./level-forecast.js";

/** Keeps level forecasts by code. */
export interface LevelForecastStore {
  find(code: string): LevelForecast | undefined;
  save(item: LevelForecast): void;
  remove(code: string): boolean;
  list(): LevelForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLevelForecastStore implements LevelForecastStore {
  items: Map<string, LevelForecast>;
  order: string[];

  constructor(items: Map<string, LevelForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LevelForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LevelForecast): void {
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

  list(): LevelForecast[] {
    const out: LevelForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLevelForecastStore(): LevelForecastStore {
  return new MemoryLevelForecastStore(new Map<string, LevelForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLevelForecastStore implements LevelForecastStore {
  inner: LevelForecastStore;
  cache: cache.TtlCache<LevelForecast>;
  hits: number;
  misses: number;

  constructor(inner: LevelForecastStore, cacheValue: cache.TtlCache<LevelForecast>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LevelForecast | undefined {
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

  save(item: LevelForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LevelForecast[] {
    return this.inner.list();
  }
}

export function newCachedLevelForecastStore(inner: LevelForecastStore, ttl: number, clockValue: clock.Clock): LevelForecastStore {
  return new CachedLevelForecastStore(inner, cache.newTtlCache<LevelForecast>(512, ttl, clockValue), 0, 0);
}

/** Selects level forecasts. Empty fields match all. */
export class LevelForecastQuery {
  label: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minGraceDays: number, statuses: string[], limit: number) {
    this.label = label;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LevelForecast): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LevelForecast[]): LevelForecast[] {
    const matched = collections.filter(items, (candidate: LevelForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLevelForecasts(store: LevelForecastStore, query: LevelForecastQuery): LevelForecast[] {
  return query.apply(store.list());
}
