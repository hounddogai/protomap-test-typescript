import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalCohortForecast } from "./regional-cohort-forecast.js";

/** Keeps regional cohort forecasts by code. */
export interface RegionalCohortForecastStore {
  find(code: string): RegionalCohortForecast | undefined;
  save(item: RegionalCohortForecast): void;
  remove(code: string): boolean;
  list(): RegionalCohortForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalCohortForecastStore implements RegionalCohortForecastStore {
  items: Map<string, RegionalCohortForecast>;
  order: string[];

  constructor(items: Map<string, RegionalCohortForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalCohortForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalCohortForecast): void {
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

  list(): RegionalCohortForecast[] {
    const out: RegionalCohortForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalCohortForecastStore(): RegionalCohortForecastStore {
  return new MemoryRegionalCohortForecastStore(new Map<string, RegionalCohortForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalCohortForecastStore implements RegionalCohortForecastStore {
  inner: RegionalCohortForecastStore;
  cache: cache.TtlCache<RegionalCohortForecast>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalCohortForecastStore,
    cacheValue: cache.TtlCache<RegionalCohortForecast>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalCohortForecast | undefined {
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

  save(item: RegionalCohortForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalCohortForecast[] {
    return this.inner.list();
  }
}

export function newCachedRegionalCohortForecastStore(inner: RegionalCohortForecastStore, ttl: number, clockValue: clock.Clock): RegionalCohortForecastStore {
  return new CachedRegionalCohortForecastStore(
    inner,
    cache.newTtlCache<RegionalCohortForecast>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional cohort forecasts. Empty fields match all. */
export class RegionalCohortForecastQuery {
  locale: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minDiscount: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalCohortForecast): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalCohortForecast[]): RegionalCohortForecast[] {
    const matched = collections.filter(items, (candidate: RegionalCohortForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalCohortForecasts(store: RegionalCohortForecastStore, query: RegionalCohortForecastQuery): RegionalCohortForecast[] {
  return query.apply(store.list());
}
