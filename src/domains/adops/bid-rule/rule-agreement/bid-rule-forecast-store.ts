import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BidRuleForecast } from "./bid-rule-forecast.js";

/** Keeps bid rule forecasts by code. */
export interface BidRuleForecastStore {
  find(code: string): BidRuleForecast | undefined;
  save(item: BidRuleForecast): void;
  remove(code: string): boolean;
  list(): BidRuleForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBidRuleForecastStore implements BidRuleForecastStore {
  items: Map<string, BidRuleForecast>;
  order: string[];

  constructor(items: Map<string, BidRuleForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BidRuleForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BidRuleForecast): void {
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

  list(): BidRuleForecast[] {
    const out: BidRuleForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBidRuleForecastStore(): BidRuleForecastStore {
  return new MemoryBidRuleForecastStore(new Map<string, BidRuleForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBidRuleForecastStore implements BidRuleForecastStore {
  inner: BidRuleForecastStore;
  cache: cache.TtlCache<BidRuleForecast>;
  hits: number;
  misses: number;

  constructor(
    inner: BidRuleForecastStore,
    cacheValue: cache.TtlCache<BidRuleForecast>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BidRuleForecast | undefined {
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

  save(item: BidRuleForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BidRuleForecast[] {
    return this.inner.list();
  }
}

export function newCachedBidRuleForecastStore(inner: BidRuleForecastStore, ttl: number, clockValue: clock.Clock): BidRuleForecastStore {
  return new CachedBidRuleForecastStore(inner, cache.newTtlCache<BidRuleForecast>(1024, ttl, clockValue), 0, 0);
}

/** Selects bid rule forecasts. Empty fields match all. */
export class BidRuleForecastQuery {
  name: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minMinimum: number, statuses: string[], limit: number) {
    this.name = name;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BidRuleForecast): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BidRuleForecast[]): BidRuleForecast[] {
    const matched = collections.filter(items, (candidate: BidRuleForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBidRuleForecasts(store: BidRuleForecastStore, query: BidRuleForecastQuery): BidRuleForecast[] {
  return query.apply(store.list());
}
