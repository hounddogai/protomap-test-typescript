import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultSlaForecast } from "./default-sla-forecast.js";

/** Keeps default sla forecasts by code. */
export interface DefaultSlaForecastStore {
  find(code: string): DefaultSlaForecast | undefined;
  save(item: DefaultSlaForecast): void;
  remove(code: string): boolean;
  list(): DefaultSlaForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultSlaForecastStore implements DefaultSlaForecastStore {
  items: Map<string, DefaultSlaForecast>;
  order: string[];

  constructor(items: Map<string, DefaultSlaForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultSlaForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultSlaForecast): void {
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

  list(): DefaultSlaForecast[] {
    const out: DefaultSlaForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultSlaForecastStore(): DefaultSlaForecastStore {
  return new MemoryDefaultSlaForecastStore(new Map<string, DefaultSlaForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultSlaForecastStore implements DefaultSlaForecastStore {
  inner: DefaultSlaForecastStore;
  cache: cache.TtlCache<DefaultSlaForecast>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultSlaForecastStore,
    cacheValue: cache.TtlCache<DefaultSlaForecast>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultSlaForecast | undefined {
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

  save(item: DefaultSlaForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultSlaForecast[] {
    return this.inner.list();
  }
}

export function newCachedDefaultSlaForecastStore(inner: DefaultSlaForecastStore, ttl: number, clockValue: clock.Clock): DefaultSlaForecastStore {
  return new CachedDefaultSlaForecastStore(inner, cache.newTtlCache<DefaultSlaForecast>(1024, ttl, clockValue), 0, 0);
}

/** Selects default sla forecasts. Empty fields match all. */
export class DefaultSlaForecastQuery {
  label: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minOpenRate: number, statuses: string[], limit: number) {
    this.label = label;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultSlaForecast): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultSlaForecast[]): DefaultSlaForecast[] {
    const matched = collections.filter(items, (candidate: DefaultSlaForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultSlaForecasts(store: DefaultSlaForecastStore, query: DefaultSlaForecastQuery): DefaultSlaForecast[] {
  return query.apply(store.list());
}
