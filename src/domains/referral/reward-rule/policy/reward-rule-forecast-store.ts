import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RewardRuleForecast } from "./reward-rule-forecast.js";

/** Keeps reward rule forecasts by code. */
export interface RewardRuleForecastStore {
  find(code: string): RewardRuleForecast | undefined;
  save(item: RewardRuleForecast): void;
  remove(code: string): boolean;
  list(): RewardRuleForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRewardRuleForecastStore implements RewardRuleForecastStore {
  items: Map<string, RewardRuleForecast>;
  order: string[];

  constructor(items: Map<string, RewardRuleForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RewardRuleForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RewardRuleForecast): void {
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

  list(): RewardRuleForecast[] {
    const out: RewardRuleForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRewardRuleForecastStore(): RewardRuleForecastStore {
  return new MemoryRewardRuleForecastStore(new Map<string, RewardRuleForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRewardRuleForecastStore implements RewardRuleForecastStore {
  inner: RewardRuleForecastStore;
  cache: cache.TtlCache<RewardRuleForecast>;
  hits: number;
  misses: number;

  constructor(
    inner: RewardRuleForecastStore,
    cacheValue: cache.TtlCache<RewardRuleForecast>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RewardRuleForecast | undefined {
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

  save(item: RewardRuleForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RewardRuleForecast[] {
    return this.inner.list();
  }
}

export function newCachedRewardRuleForecastStore(inner: RewardRuleForecastStore, ttl: number, clockValue: clock.Clock): RewardRuleForecastStore {
  return new CachedRewardRuleForecastStore(inner, cache.newTtlCache<RewardRuleForecast>(256, ttl, clockValue), 0, 0);
}

/** Selects reward rule forecasts. Empty fields match all. */
export class RewardRuleForecastQuery {
  utmSource: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minStartsAt: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RewardRuleForecast): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RewardRuleForecast[]): RewardRuleForecast[] {
    const matched = collections.filter(items, (candidate: RewardRuleForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRewardRuleForecasts(store: RewardRuleForecastStore, query: RewardRuleForecastQuery): RewardRuleForecast[] {
  return query.apply(store.list());
}
