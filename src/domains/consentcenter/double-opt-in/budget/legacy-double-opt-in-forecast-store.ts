import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyDoubleOptInForecast } from "./legacy-double-opt-in-forecast.js";

/** Keeps legacy double opt in forecasts by code. */
export interface LegacyDoubleOptInForecastStore {
  find(code: string): LegacyDoubleOptInForecast | undefined;
  save(item: LegacyDoubleOptInForecast): void;
  remove(code: string): boolean;
  list(): LegacyDoubleOptInForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyDoubleOptInForecastStore implements LegacyDoubleOptInForecastStore {
  items: Map<string, LegacyDoubleOptInForecast>;
  order: string[];

  constructor(items: Map<string, LegacyDoubleOptInForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyDoubleOptInForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyDoubleOptInForecast): void {
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

  list(): LegacyDoubleOptInForecast[] {
    const out: LegacyDoubleOptInForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyDoubleOptInForecastStore(): LegacyDoubleOptInForecastStore {
  return new MemoryLegacyDoubleOptInForecastStore(new Map<string, LegacyDoubleOptInForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyDoubleOptInForecastStore implements LegacyDoubleOptInForecastStore {
  inner: LegacyDoubleOptInForecastStore;
  cache: cache.TtlCache<LegacyDoubleOptInForecast>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyDoubleOptInForecastStore,
    cacheValue: cache.TtlCache<LegacyDoubleOptInForecast>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyDoubleOptInForecast | undefined {
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

  save(item: LegacyDoubleOptInForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyDoubleOptInForecast[] {
    return this.inner.list();
  }
}

export function newCachedLegacyDoubleOptInForecastStore(inner: LegacyDoubleOptInForecastStore, ttl: number, clockValue: clock.Clock): LegacyDoubleOptInForecastStore {
  return new CachedLegacyDoubleOptInForecastStore(
    inner,
    cache.newTtlCache<LegacyDoubleOptInForecast>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy double opt in forecasts. Empty fields match all. */
export class LegacyDoubleOptInForecastQuery {
  region: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minSequence: number, statuses: string[], limit: number) {
    this.region = region;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyDoubleOptInForecast): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyDoubleOptInForecast[]): LegacyDoubleOptInForecast[] {
    const matched = collections.filter(items, (candidate: LegacyDoubleOptInForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyDoubleOptInForecasts(store: LegacyDoubleOptInForecastStore, query: LegacyDoubleOptInForecastQuery): LegacyDoubleOptInForecast[] {
  return query.apply(store.list());
}
