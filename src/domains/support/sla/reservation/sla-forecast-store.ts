import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SlaForecast } from "./sla-forecast.js";

/** Keeps sla forecasts by code. */
export interface SlaForecastStore {
  find(code: string): SlaForecast | undefined;
  save(item: SlaForecast): void;
  remove(code: string): boolean;
  list(): SlaForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySlaForecastStore implements SlaForecastStore {
  items: Map<string, SlaForecast>;
  order: string[];

  constructor(items: Map<string, SlaForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SlaForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SlaForecast): void {
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

  list(): SlaForecast[] {
    const out: SlaForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySlaForecastStore(): SlaForecastStore {
  return new MemorySlaForecastStore(new Map<string, SlaForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSlaForecastStore implements SlaForecastStore {
  inner: SlaForecastStore;
  cache: cache.TtlCache<SlaForecast>;
  hits: number;
  misses: number;

  constructor(inner: SlaForecastStore, cacheValue: cache.TtlCache<SlaForecast>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SlaForecast | undefined {
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

  save(item: SlaForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SlaForecast[] {
    return this.inner.list();
  }
}

export function newCachedSlaForecastStore(inner: SlaForecastStore, ttl: number, clockValue: clock.Clock): SlaForecastStore {
  return new CachedSlaForecastStore(inner, cache.newTtlCache<SlaForecast>(128, ttl, clockValue), 0, 0);
}

/** Selects sla forecasts. Empty fields match all. */
export class SlaForecastQuery {
  channel: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minVersion: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SlaForecast): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SlaForecast[]): SlaForecast[] {
    const matched = collections.filter(items, (candidate: SlaForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSlaForecasts(store: SlaForecastStore, query: SlaForecastQuery): SlaForecast[] {
  return query.apply(store.list());
}
