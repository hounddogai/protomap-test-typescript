import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredApprovalForecast } from "./tiered-approval-forecast.js";

/** Keeps tiered approval forecasts by code. */
export interface TieredApprovalForecastStore {
  find(code: string): TieredApprovalForecast | undefined;
  save(item: TieredApprovalForecast): void;
  remove(code: string): boolean;
  list(): TieredApprovalForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredApprovalForecastStore implements TieredApprovalForecastStore {
  items: Map<string, TieredApprovalForecast>;
  order: string[];

  constructor(items: Map<string, TieredApprovalForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredApprovalForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredApprovalForecast): void {
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

  list(): TieredApprovalForecast[] {
    const out: TieredApprovalForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredApprovalForecastStore(): TieredApprovalForecastStore {
  return new MemoryTieredApprovalForecastStore(new Map<string, TieredApprovalForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredApprovalForecastStore implements TieredApprovalForecastStore {
  inner: TieredApprovalForecastStore;
  cache: cache.TtlCache<TieredApprovalForecast>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredApprovalForecastStore,
    cacheValue: cache.TtlCache<TieredApprovalForecast>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredApprovalForecast | undefined {
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

  save(item: TieredApprovalForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredApprovalForecast[] {
    return this.inner.list();
  }
}

export function newCachedTieredApprovalForecastStore(inner: TieredApprovalForecastStore, ttl: number, clockValue: clock.Clock): TieredApprovalForecastStore {
  return new CachedTieredApprovalForecastStore(
    inner,
    cache.newTtlCache<TieredApprovalForecast>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered approval forecasts. Empty fields match all. */
export class TieredApprovalForecastQuery {
  region: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minStartsAt: number, statuses: string[], limit: number) {
    this.region = region;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredApprovalForecast): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredApprovalForecast[]): TieredApprovalForecast[] {
    const matched = collections.filter(items, (candidate: TieredApprovalForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredApprovalForecasts(store: TieredApprovalForecastStore, query: TieredApprovalForecastQuery): TieredApprovalForecast[] {
  return query.apply(store.list());
}
