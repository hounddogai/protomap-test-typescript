import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryRewardRuleForecast } from "./primary-reward-rule-forecast.js";

/** Keeps primary reward rule forecasts by code. */
export interface PrimaryRewardRuleForecastStore {
  find(code: string): PrimaryRewardRuleForecast | undefined;
  save(item: PrimaryRewardRuleForecast): void;
  remove(code: string): boolean;
  list(): PrimaryRewardRuleForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryRewardRuleForecastStore implements PrimaryRewardRuleForecastStore {
  items: Map<string, PrimaryRewardRuleForecast>;
  order: string[];

  constructor(items: Map<string, PrimaryRewardRuleForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryRewardRuleForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryRewardRuleForecast): void {
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

  list(): PrimaryRewardRuleForecast[] {
    const out: PrimaryRewardRuleForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryRewardRuleForecastStore(): PrimaryRewardRuleForecastStore {
  return new MemoryPrimaryRewardRuleForecastStore(new Map<string, PrimaryRewardRuleForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryRewardRuleForecastStore implements PrimaryRewardRuleForecastStore {
  inner: PrimaryRewardRuleForecastStore;
  cache: cache.TtlCache<PrimaryRewardRuleForecast>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryRewardRuleForecastStore,
    cacheValue: cache.TtlCache<PrimaryRewardRuleForecast>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryRewardRuleForecast | undefined {
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

  save(item: PrimaryRewardRuleForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryRewardRuleForecast[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryRewardRuleForecastStore(inner: PrimaryRewardRuleForecastStore, ttl: number, clockValue: clock.Clock): PrimaryRewardRuleForecastStore {
  return new CachedPrimaryRewardRuleForecastStore(
    inner,
    cache.newTtlCache<PrimaryRewardRuleForecast>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary reward rule forecasts. Empty fields match all. */
export class PrimaryRewardRuleForecastQuery {
  utmSource: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minCeiling: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryRewardRuleForecast): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryRewardRuleForecast[]): PrimaryRewardRuleForecast[] {
    const matched = collections.filter(items, (candidate: PrimaryRewardRuleForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryRewardRuleForecasts(store: PrimaryRewardRuleForecastStore, query: PrimaryRewardRuleForecastQuery): PrimaryRewardRuleForecast[] {
  return query.apply(store.list());
}
