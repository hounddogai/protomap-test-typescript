import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryBadgeForecast } from "./primary-badge-forecast.js";

/** Keeps primary badge forecasts by code. */
export interface PrimaryBadgeForecastStore {
  find(code: string): PrimaryBadgeForecast | undefined;
  save(item: PrimaryBadgeForecast): void;
  remove(code: string): boolean;
  list(): PrimaryBadgeForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryBadgeForecastStore implements PrimaryBadgeForecastStore {
  items: Map<string, PrimaryBadgeForecast>;
  order: string[];

  constructor(items: Map<string, PrimaryBadgeForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryBadgeForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryBadgeForecast): void {
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

  list(): PrimaryBadgeForecast[] {
    const out: PrimaryBadgeForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryBadgeForecastStore(): PrimaryBadgeForecastStore {
  return new MemoryPrimaryBadgeForecastStore(new Map<string, PrimaryBadgeForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryBadgeForecastStore implements PrimaryBadgeForecastStore {
  inner: PrimaryBadgeForecastStore;
  cache: cache.TtlCache<PrimaryBadgeForecast>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryBadgeForecastStore,
    cacheValue: cache.TtlCache<PrimaryBadgeForecast>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryBadgeForecast | undefined {
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

  save(item: PrimaryBadgeForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryBadgeForecast[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryBadgeForecastStore(inner: PrimaryBadgeForecastStore, ttl: number, clockValue: clock.Clock): PrimaryBadgeForecastStore {
  return new CachedPrimaryBadgeForecastStore(inner, cache.newTtlCache<PrimaryBadgeForecast>(64, ttl, clockValue), 0, 0);
}

/** Selects primary badge forecasts. Empty fields match all. */
export class PrimaryBadgeForecastQuery {
  source: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minScore: number, statuses: string[], limit: number) {
    this.source = source;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryBadgeForecast): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryBadgeForecast[]): PrimaryBadgeForecast[] {
    const matched = collections.filter(items, (candidate: PrimaryBadgeForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryBadgeForecasts(store: PrimaryBadgeForecastStore, query: PrimaryBadgeForecastQuery): PrimaryBadgeForecast[] {
  return query.apply(store.list());
}
