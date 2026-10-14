import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ExitRuleForecast } from "./exit-rule-forecast.js";

/** Keeps exit rule forecasts by code. */
export interface ExitRuleForecastStore {
  find(code: string): ExitRuleForecast | undefined;
  save(item: ExitRuleForecast): void;
  remove(code: string): boolean;
  list(): ExitRuleForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryExitRuleForecastStore implements ExitRuleForecastStore {
  items: Map<string, ExitRuleForecast>;
  order: string[];

  constructor(items: Map<string, ExitRuleForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ExitRuleForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ExitRuleForecast): void {
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

  list(): ExitRuleForecast[] {
    const out: ExitRuleForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryExitRuleForecastStore(): ExitRuleForecastStore {
  return new MemoryExitRuleForecastStore(new Map<string, ExitRuleForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedExitRuleForecastStore implements ExitRuleForecastStore {
  inner: ExitRuleForecastStore;
  cache: cache.TtlCache<ExitRuleForecast>;
  hits: number;
  misses: number;

  constructor(
    inner: ExitRuleForecastStore,
    cacheValue: cache.TtlCache<ExitRuleForecast>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ExitRuleForecast | undefined {
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

  save(item: ExitRuleForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ExitRuleForecast[] {
    return this.inner.list();
  }
}

export function newCachedExitRuleForecastStore(inner: ExitRuleForecastStore, ttl: number, clockValue: clock.Clock): ExitRuleForecastStore {
  return new CachedExitRuleForecastStore(inner, cache.newTtlCache<ExitRuleForecast>(512, ttl, clockValue), 0, 0);
}

/** Selects exit rule forecasts. Empty fields match all. */
export class ExitRuleForecastQuery {
  name: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minRevision: number, statuses: string[], limit: number) {
    this.name = name;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ExitRuleForecast): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ExitRuleForecast[]): ExitRuleForecast[] {
    const matched = collections.filter(items, (candidate: ExitRuleForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findExitRuleForecasts(store: ExitRuleForecastStore, query: ExitRuleForecastQuery): ExitRuleForecast[] {
  return query.apply(store.list());
}
