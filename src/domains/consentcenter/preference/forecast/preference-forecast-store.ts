import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PreferenceForecast } from "./preference-forecast.js";

/** Keeps preference forecasts by code. */
export interface PreferenceForecastStore {
  find(code: string): PreferenceForecast | undefined;
  save(item: PreferenceForecast): void;
  remove(code: string): boolean;
  list(): PreferenceForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPreferenceForecastStore implements PreferenceForecastStore {
  items: Map<string, PreferenceForecast>;
  order: string[];

  constructor(items: Map<string, PreferenceForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PreferenceForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PreferenceForecast): void {
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

  list(): PreferenceForecast[] {
    const out: PreferenceForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPreferenceForecastStore(): PreferenceForecastStore {
  return new MemoryPreferenceForecastStore(new Map<string, PreferenceForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPreferenceForecastStore implements PreferenceForecastStore {
  inner: PreferenceForecastStore;
  cache: cache.TtlCache<PreferenceForecast>;
  hits: number;
  misses: number;

  constructor(
    inner: PreferenceForecastStore,
    cacheValue: cache.TtlCache<PreferenceForecast>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PreferenceForecast | undefined {
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

  save(item: PreferenceForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PreferenceForecast[] {
    return this.inner.list();
  }
}

export function newCachedPreferenceForecastStore(inner: PreferenceForecastStore, ttl: number, clockValue: clock.Clock): PreferenceForecastStore {
  return new CachedPreferenceForecastStore(inner, cache.newTtlCache<PreferenceForecast>(256, ttl, clockValue), 0, 0);
}

/** Selects preference forecasts. Empty fields match all. */
export class PreferenceForecastQuery {
  name: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.name = name;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PreferenceForecast): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PreferenceForecast[]): PreferenceForecast[] {
    const matched = collections.filter(items, (candidate: PreferenceForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPreferenceForecasts(store: PreferenceForecastStore, query: PreferenceForecastQuery): PreferenceForecast[] {
  return query.apply(store.list());
}
