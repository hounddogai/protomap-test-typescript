import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ApprovalForecast } from "./approval-forecast.js";

/** Keeps approval forecasts by code. */
export interface ApprovalForecastStore {
  find(code: string): ApprovalForecast | undefined;
  save(item: ApprovalForecast): void;
  remove(code: string): boolean;
  list(): ApprovalForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryApprovalForecastStore implements ApprovalForecastStore {
  items: Map<string, ApprovalForecast>;
  order: string[];

  constructor(items: Map<string, ApprovalForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ApprovalForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ApprovalForecast): void {
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

  list(): ApprovalForecast[] {
    const out: ApprovalForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryApprovalForecastStore(): ApprovalForecastStore {
  return new MemoryApprovalForecastStore(new Map<string, ApprovalForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedApprovalForecastStore implements ApprovalForecastStore {
  inner: ApprovalForecastStore;
  cache: cache.TtlCache<ApprovalForecast>;
  hits: number;
  misses: number;

  constructor(
    inner: ApprovalForecastStore,
    cacheValue: cache.TtlCache<ApprovalForecast>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ApprovalForecast | undefined {
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

  save(item: ApprovalForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ApprovalForecast[] {
    return this.inner.list();
  }
}

export function newCachedApprovalForecastStore(inner: ApprovalForecastStore, ttl: number, clockValue: clock.Clock): ApprovalForecastStore {
  return new CachedApprovalForecastStore(inner, cache.newTtlCache<ApprovalForecast>(64, ttl, clockValue), 0, 0);
}

/** Selects approval forecasts. Empty fields match all. */
export class ApprovalForecastQuery {
  name: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minAmount: number, statuses: string[], limit: number) {
    this.name = name;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ApprovalForecast): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ApprovalForecast[]): ApprovalForecast[] {
    const matched = collections.filter(items, (candidate: ApprovalForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findApprovalForecasts(store: ApprovalForecastStore, query: ApprovalForecastQuery): ApprovalForecast[] {
  return query.apply(store.list());
}
