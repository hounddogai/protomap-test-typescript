import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalPathForecast } from "./regional-path-forecast.js";

/** Keeps regional path forecasts by code. */
export interface RegionalPathForecastStore {
  find(code: string): RegionalPathForecast | undefined;
  save(item: RegionalPathForecast): void;
  remove(code: string): boolean;
  list(): RegionalPathForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalPathForecastStore implements RegionalPathForecastStore {
  items: Map<string, RegionalPathForecast>;
  order: string[];

  constructor(items: Map<string, RegionalPathForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalPathForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalPathForecast): void {
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

  list(): RegionalPathForecast[] {
    const out: RegionalPathForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalPathForecastStore(): RegionalPathForecastStore {
  return new MemoryRegionalPathForecastStore(new Map<string, RegionalPathForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalPathForecastStore implements RegionalPathForecastStore {
  inner: RegionalPathForecastStore;
  cache: cache.TtlCache<RegionalPathForecast>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalPathForecastStore,
    cacheValue: cache.TtlCache<RegionalPathForecast>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalPathForecast | undefined {
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

  save(item: RegionalPathForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalPathForecast[] {
    return this.inner.list();
  }
}

export function newCachedRegionalPathForecastStore(inner: RegionalPathForecastStore, ttl: number, clockValue: clock.Clock): RegionalPathForecastStore {
  return new CachedRegionalPathForecastStore(
    inner,
    cache.newTtlCache<RegionalPathForecast>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional path forecasts. Empty fields match all. */
export class RegionalPathForecastQuery {
  channel: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minWeight: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalPathForecast): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalPathForecast[]): RegionalPathForecast[] {
    const matched = collections.filter(items, (candidate: RegionalPathForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalPathForecasts(store: RegionalPathForecastStore, query: RegionalPathForecastQuery): RegionalPathForecast[] {
  return query.apply(store.list());
}
