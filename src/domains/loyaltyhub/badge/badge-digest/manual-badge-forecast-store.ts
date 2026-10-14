import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualBadgeForecast } from "./manual-badge-forecast.js";

/** Keeps manual badge forecasts by code. */
export interface ManualBadgeForecastStore {
  find(code: string): ManualBadgeForecast | undefined;
  save(item: ManualBadgeForecast): void;
  remove(code: string): boolean;
  list(): ManualBadgeForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualBadgeForecastStore implements ManualBadgeForecastStore {
  items: Map<string, ManualBadgeForecast>;
  order: string[];

  constructor(items: Map<string, ManualBadgeForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualBadgeForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualBadgeForecast): void {
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

  list(): ManualBadgeForecast[] {
    const out: ManualBadgeForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualBadgeForecastStore(): ManualBadgeForecastStore {
  return new MemoryManualBadgeForecastStore(new Map<string, ManualBadgeForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualBadgeForecastStore implements ManualBadgeForecastStore {
  inner: ManualBadgeForecastStore;
  cache: cache.TtlCache<ManualBadgeForecast>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualBadgeForecastStore,
    cacheValue: cache.TtlCache<ManualBadgeForecast>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualBadgeForecast | undefined {
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

  save(item: ManualBadgeForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualBadgeForecast[] {
    return this.inner.list();
  }
}

export function newCachedManualBadgeForecastStore(inner: ManualBadgeForecastStore, ttl: number, clockValue: clock.Clock): ManualBadgeForecastStore {
  return new CachedManualBadgeForecastStore(inner, cache.newTtlCache<ManualBadgeForecast>(1024, ttl, clockValue), 0, 0);
}

/** Selects manual badge forecasts. Empty fields match all. */
export class ManualBadgeForecastQuery {
  channel: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minAttempts: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualBadgeForecast): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualBadgeForecast[]): ManualBadgeForecast[] {
    const matched = collections.filter(items, (candidate: ManualBadgeForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualBadgeForecasts(store: ManualBadgeForecastStore, query: ManualBadgeForecastQuery): ManualBadgeForecast[] {
  return query.apply(store.list());
}
