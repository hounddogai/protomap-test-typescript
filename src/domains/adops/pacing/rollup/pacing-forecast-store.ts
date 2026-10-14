import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PacingForecast } from "./pacing-forecast.js";

/** Keeps pacing forecasts by code. */
export interface PacingForecastStore {
  find(code: string): PacingForecast | undefined;
  save(item: PacingForecast): void;
  remove(code: string): boolean;
  list(): PacingForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPacingForecastStore implements PacingForecastStore {
  items: Map<string, PacingForecast>;
  order: string[];

  constructor(items: Map<string, PacingForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PacingForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PacingForecast): void {
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

  list(): PacingForecast[] {
    const out: PacingForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPacingForecastStore(): PacingForecastStore {
  return new MemoryPacingForecastStore(new Map<string, PacingForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPacingForecastStore implements PacingForecastStore {
  inner: PacingForecastStore;
  cache: cache.TtlCache<PacingForecast>;
  hits: number;
  misses: number;

  constructor(
    inner: PacingForecastStore,
    cacheValue: cache.TtlCache<PacingForecast>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PacingForecast | undefined {
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

  save(item: PacingForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PacingForecast[] {
    return this.inner.list();
  }
}

export function newCachedPacingForecastStore(inner: PacingForecastStore, ttl: number, clockValue: clock.Clock): PacingForecastStore {
  return new CachedPacingForecastStore(inner, cache.newTtlCache<PacingForecast>(256, ttl, clockValue), 0, 0);
}

/** Selects pacing forecasts. Empty fields match all. */
export class PacingForecastQuery {
  segment: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PacingForecast): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PacingForecast[]): PacingForecast[] {
    const matched = collections.filter(items, (candidate: PacingForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPacingForecasts(store: PacingForecastStore, query: PacingForecastQuery): PacingForecast[] {
  return query.apply(store.list());
}
