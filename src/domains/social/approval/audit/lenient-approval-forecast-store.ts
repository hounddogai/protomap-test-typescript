import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientApprovalForecast } from "./lenient-approval-forecast.js";

/** Keeps lenient approval forecasts by code. */
export interface LenientApprovalForecastStore {
  find(code: string): LenientApprovalForecast | undefined;
  save(item: LenientApprovalForecast): void;
  remove(code: string): boolean;
  list(): LenientApprovalForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientApprovalForecastStore implements LenientApprovalForecastStore {
  items: Map<string, LenientApprovalForecast>;
  order: string[];

  constructor(items: Map<string, LenientApprovalForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientApprovalForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientApprovalForecast): void {
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

  list(): LenientApprovalForecast[] {
    const out: LenientApprovalForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientApprovalForecastStore(): LenientApprovalForecastStore {
  return new MemoryLenientApprovalForecastStore(new Map<string, LenientApprovalForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientApprovalForecastStore implements LenientApprovalForecastStore {
  inner: LenientApprovalForecastStore;
  cache: cache.TtlCache<LenientApprovalForecast>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientApprovalForecastStore,
    cacheValue: cache.TtlCache<LenientApprovalForecast>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientApprovalForecast | undefined {
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

  save(item: LenientApprovalForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientApprovalForecast[] {
    return this.inner.list();
  }
}

export function newCachedLenientApprovalForecastStore(inner: LenientApprovalForecastStore, ttl: number, clockValue: clock.Clock): LenientApprovalForecastStore {
  return new CachedLenientApprovalForecastStore(
    inner,
    cache.newTtlCache<LenientApprovalForecast>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient approval forecasts. Empty fields match all. */
export class LenientApprovalForecastQuery {
  name: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minImpressions: number, statuses: string[], limit: number) {
    this.name = name;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientApprovalForecast): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientApprovalForecast[]): LenientApprovalForecast[] {
    const matched = collections.filter(items, (candidate: LenientApprovalForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientApprovalForecasts(store: LenientApprovalForecastStore, query: LenientApprovalForecastQuery): LenientApprovalForecast[] {
  return query.apply(store.list());
}
