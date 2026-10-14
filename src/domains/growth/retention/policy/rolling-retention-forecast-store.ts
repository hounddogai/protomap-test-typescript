import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingRetentionForecast } from "./rolling-retention-forecast.js";

/** Keeps rolling retention forecasts by code. */
export interface RollingRetentionForecastStore {
  find(code: string): RollingRetentionForecast | undefined;
  save(item: RollingRetentionForecast): void;
  remove(code: string): boolean;
  list(): RollingRetentionForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingRetentionForecastStore implements RollingRetentionForecastStore {
  items: Map<string, RollingRetentionForecast>;
  order: string[];

  constructor(items: Map<string, RollingRetentionForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingRetentionForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingRetentionForecast): void {
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

  list(): RollingRetentionForecast[] {
    const out: RollingRetentionForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingRetentionForecastStore(): RollingRetentionForecastStore {
  return new MemoryRollingRetentionForecastStore(new Map<string, RollingRetentionForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingRetentionForecastStore implements RollingRetentionForecastStore {
  inner: RollingRetentionForecastStore;
  cache: cache.TtlCache<RollingRetentionForecast>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingRetentionForecastStore,
    cacheValue: cache.TtlCache<RollingRetentionForecast>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingRetentionForecast | undefined {
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

  save(item: RollingRetentionForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingRetentionForecast[] {
    return this.inner.list();
  }
}

export function newCachedRollingRetentionForecastStore(inner: RollingRetentionForecastStore, ttl: number, clockValue: clock.Clock): RollingRetentionForecastStore {
  return new CachedRollingRetentionForecastStore(
    inner,
    cache.newTtlCache<RollingRetentionForecast>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling retention forecasts. Empty fields match all. */
export class RollingRetentionForecastQuery {
  label: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minBudget: number, statuses: string[], limit: number) {
    this.label = label;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingRetentionForecast): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingRetentionForecast[]): RollingRetentionForecast[] {
    const matched = collections.filter(items, (candidate: RollingRetentionForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingRetentionForecasts(store: RollingRetentionForecastStore, query: RollingRetentionForecastQuery): RollingRetentionForecast[] {
  return query.apply(store.list());
}
