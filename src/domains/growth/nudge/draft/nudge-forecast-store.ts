import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { NudgeForecast } from "./nudge-forecast.js";

/** Keeps nudge forecasts by code. */
export interface NudgeForecastStore {
  find(code: string): NudgeForecast | undefined;
  save(item: NudgeForecast): void;
  remove(code: string): boolean;
  list(): NudgeForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryNudgeForecastStore implements NudgeForecastStore {
  items: Map<string, NudgeForecast>;
  order: string[];

  constructor(items: Map<string, NudgeForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): NudgeForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: NudgeForecast): void {
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

  list(): NudgeForecast[] {
    const out: NudgeForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryNudgeForecastStore(): NudgeForecastStore {
  return new MemoryNudgeForecastStore(new Map<string, NudgeForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedNudgeForecastStore implements NudgeForecastStore {
  inner: NudgeForecastStore;
  cache: cache.TtlCache<NudgeForecast>;
  hits: number;
  misses: number;

  constructor(inner: NudgeForecastStore, cacheValue: cache.TtlCache<NudgeForecast>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): NudgeForecast | undefined {
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

  save(item: NudgeForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): NudgeForecast[] {
    return this.inner.list();
  }
}

export function newCachedNudgeForecastStore(inner: NudgeForecastStore, ttl: number, clockValue: clock.Clock): NudgeForecastStore {
  return new CachedNudgeForecastStore(inner, cache.newTtlCache<NudgeForecast>(256, ttl, clockValue), 0, 0);
}

/** Selects nudge forecasts. Empty fields match all. */
export class NudgeForecastQuery {
  segment: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minAttempts: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: NudgeForecast): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: NudgeForecast[]): NudgeForecast[] {
    const matched = collections.filter(items, (candidate: NudgeForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findNudgeForecasts(store: NudgeForecastStore, query: NudgeForecastQuery): NudgeForecast[] {
  return query.apply(store.list());
}
