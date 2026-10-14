import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledPathForecast } from "./scheduled-path-forecast.js";

/** Keeps scheduled path forecasts by code. */
export interface ScheduledPathForecastStore {
  find(code: string): ScheduledPathForecast | undefined;
  save(item: ScheduledPathForecast): void;
  remove(code: string): boolean;
  list(): ScheduledPathForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledPathForecastStore implements ScheduledPathForecastStore {
  items: Map<string, ScheduledPathForecast>;
  order: string[];

  constructor(items: Map<string, ScheduledPathForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledPathForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledPathForecast): void {
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

  list(): ScheduledPathForecast[] {
    const out: ScheduledPathForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledPathForecastStore(): ScheduledPathForecastStore {
  return new MemoryScheduledPathForecastStore(new Map<string, ScheduledPathForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledPathForecastStore implements ScheduledPathForecastStore {
  inner: ScheduledPathForecastStore;
  cache: cache.TtlCache<ScheduledPathForecast>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledPathForecastStore,
    cacheValue: cache.TtlCache<ScheduledPathForecast>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledPathForecast | undefined {
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

  save(item: ScheduledPathForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledPathForecast[] {
    return this.inner.list();
  }
}

export function newCachedScheduledPathForecastStore(inner: ScheduledPathForecastStore, ttl: number, clockValue: clock.Clock): ScheduledPathForecastStore {
  return new CachedScheduledPathForecastStore(
    inner,
    cache.newTtlCache<ScheduledPathForecast>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled path forecasts. Empty fields match all. */
export class ScheduledPathForecastQuery {
  segment: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minEndsAt: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledPathForecast): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledPathForecast[]): ScheduledPathForecast[] {
    const matched = collections.filter(items, (candidate: ScheduledPathForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledPathForecasts(store: ScheduledPathForecastStore, query: ScheduledPathForecastQuery): ScheduledPathForecast[] {
  return query.apply(store.list());
}
