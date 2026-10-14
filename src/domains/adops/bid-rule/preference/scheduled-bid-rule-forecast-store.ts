import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledBidRuleForecast } from "./scheduled-bid-rule-forecast.js";

/** Keeps scheduled bid rule forecasts by code. */
export interface ScheduledBidRuleForecastStore {
  find(code: string): ScheduledBidRuleForecast | undefined;
  save(item: ScheduledBidRuleForecast): void;
  remove(code: string): boolean;
  list(): ScheduledBidRuleForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledBidRuleForecastStore implements ScheduledBidRuleForecastStore {
  items: Map<string, ScheduledBidRuleForecast>;
  order: string[];

  constructor(items: Map<string, ScheduledBidRuleForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledBidRuleForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledBidRuleForecast): void {
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

  list(): ScheduledBidRuleForecast[] {
    const out: ScheduledBidRuleForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledBidRuleForecastStore(): ScheduledBidRuleForecastStore {
  return new MemoryScheduledBidRuleForecastStore(new Map<string, ScheduledBidRuleForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledBidRuleForecastStore implements ScheduledBidRuleForecastStore {
  inner: ScheduledBidRuleForecastStore;
  cache: cache.TtlCache<ScheduledBidRuleForecast>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledBidRuleForecastStore,
    cacheValue: cache.TtlCache<ScheduledBidRuleForecast>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledBidRuleForecast | undefined {
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

  save(item: ScheduledBidRuleForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledBidRuleForecast[] {
    return this.inner.list();
  }
}

export function newCachedScheduledBidRuleForecastStore(inner: ScheduledBidRuleForecastStore, ttl: number, clockValue: clock.Clock): ScheduledBidRuleForecastStore {
  return new CachedScheduledBidRuleForecastStore(
    inner,
    cache.newTtlCache<ScheduledBidRuleForecast>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled bid rule forecasts. Empty fields match all. */
export class ScheduledBidRuleForecastQuery {
  title: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minThreshold: number, statuses: string[], limit: number) {
    this.title = title;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledBidRuleForecast): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledBidRuleForecast[]): ScheduledBidRuleForecast[] {
    const matched = collections.filter(items, (candidate: ScheduledBidRuleForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledBidRuleForecasts(store: ScheduledBidRuleForecastStore, query: ScheduledBidRuleForecastQuery): ScheduledBidRuleForecast[] {
  return query.apply(store.list());
}
