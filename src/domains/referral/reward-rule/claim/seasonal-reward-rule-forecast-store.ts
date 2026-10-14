import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalRewardRuleForecast } from "./seasonal-reward-rule-forecast.js";

/** Keeps seasonal reward rule forecasts by code. */
export interface SeasonalRewardRuleForecastStore {
  find(code: string): SeasonalRewardRuleForecast | undefined;
  save(item: SeasonalRewardRuleForecast): void;
  remove(code: string): boolean;
  list(): SeasonalRewardRuleForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalRewardRuleForecastStore implements SeasonalRewardRuleForecastStore {
  items: Map<string, SeasonalRewardRuleForecast>;
  order: string[];

  constructor(items: Map<string, SeasonalRewardRuleForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalRewardRuleForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalRewardRuleForecast): void {
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

  list(): SeasonalRewardRuleForecast[] {
    const out: SeasonalRewardRuleForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalRewardRuleForecastStore(): SeasonalRewardRuleForecastStore {
  return new MemorySeasonalRewardRuleForecastStore(new Map<string, SeasonalRewardRuleForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalRewardRuleForecastStore implements SeasonalRewardRuleForecastStore {
  inner: SeasonalRewardRuleForecastStore;
  cache: cache.TtlCache<SeasonalRewardRuleForecast>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalRewardRuleForecastStore,
    cacheValue: cache.TtlCache<SeasonalRewardRuleForecast>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalRewardRuleForecast | undefined {
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

  save(item: SeasonalRewardRuleForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalRewardRuleForecast[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalRewardRuleForecastStore(inner: SeasonalRewardRuleForecastStore, ttl: number, clockValue: clock.Clock): SeasonalRewardRuleForecastStore {
  return new CachedSeasonalRewardRuleForecastStore(
    inner,
    cache.newTtlCache<SeasonalRewardRuleForecast>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal reward rule forecasts. Empty fields match all. */
export class SeasonalRewardRuleForecastQuery {
  name: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minBudget: number, statuses: string[], limit: number) {
    this.name = name;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalRewardRuleForecast): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalRewardRuleForecast[]): SeasonalRewardRuleForecast[] {
    const matched = collections.filter(items, (candidate: SeasonalRewardRuleForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalRewardRuleForecasts(store: SeasonalRewardRuleForecastStore, query: SeasonalRewardRuleForecastQuery): SeasonalRewardRuleForecast[] {
  return query.apply(store.list());
}
