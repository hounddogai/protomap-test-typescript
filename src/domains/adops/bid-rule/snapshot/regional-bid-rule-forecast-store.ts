import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalBidRuleForecast } from "./regional-bid-rule-forecast.js";

/** Keeps regional bid rule forecasts by code. */
export interface RegionalBidRuleForecastStore {
  find(code: string): RegionalBidRuleForecast | undefined;
  save(item: RegionalBidRuleForecast): void;
  remove(code: string): boolean;
  list(): RegionalBidRuleForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalBidRuleForecastStore implements RegionalBidRuleForecastStore {
  items: Map<string, RegionalBidRuleForecast>;
  order: string[];

  constructor(items: Map<string, RegionalBidRuleForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalBidRuleForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalBidRuleForecast): void {
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

  list(): RegionalBidRuleForecast[] {
    const out: RegionalBidRuleForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalBidRuleForecastStore(): RegionalBidRuleForecastStore {
  return new MemoryRegionalBidRuleForecastStore(new Map<string, RegionalBidRuleForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalBidRuleForecastStore implements RegionalBidRuleForecastStore {
  inner: RegionalBidRuleForecastStore;
  cache: cache.TtlCache<RegionalBidRuleForecast>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalBidRuleForecastStore,
    cacheValue: cache.TtlCache<RegionalBidRuleForecast>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalBidRuleForecast | undefined {
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

  save(item: RegionalBidRuleForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalBidRuleForecast[] {
    return this.inner.list();
  }
}

export function newCachedRegionalBidRuleForecastStore(inner: RegionalBidRuleForecastStore, ttl: number, clockValue: clock.Clock): RegionalBidRuleForecastStore {
  return new CachedRegionalBidRuleForecastStore(
    inner,
    cache.newTtlCache<RegionalBidRuleForecast>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional bid rule forecasts. Empty fields match all. */
export class RegionalBidRuleForecastQuery {
  channel: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minQuantity: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalBidRuleForecast): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalBidRuleForecast[]): RegionalBidRuleForecast[] {
    const matched = collections.filter(items, (candidate: RegionalBidRuleForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalBidRuleForecasts(store: RegionalBidRuleForecastStore, query: RegionalBidRuleForecastQuery): RegionalBidRuleForecast[] {
  return query.apply(store.list());
}
