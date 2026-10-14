import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ChallengeForecast } from "./challenge-forecast.js";

/** Keeps challenge forecasts by code. */
export interface ChallengeForecastStore {
  find(code: string): ChallengeForecast | undefined;
  save(item: ChallengeForecast): void;
  remove(code: string): boolean;
  list(): ChallengeForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryChallengeForecastStore implements ChallengeForecastStore {
  items: Map<string, ChallengeForecast>;
  order: string[];

  constructor(items: Map<string, ChallengeForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ChallengeForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ChallengeForecast): void {
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

  list(): ChallengeForecast[] {
    const out: ChallengeForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryChallengeForecastStore(): ChallengeForecastStore {
  return new MemoryChallengeForecastStore(new Map<string, ChallengeForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedChallengeForecastStore implements ChallengeForecastStore {
  inner: ChallengeForecastStore;
  cache: cache.TtlCache<ChallengeForecast>;
  hits: number;
  misses: number;

  constructor(
    inner: ChallengeForecastStore,
    cacheValue: cache.TtlCache<ChallengeForecast>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ChallengeForecast | undefined {
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

  save(item: ChallengeForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ChallengeForecast[] {
    return this.inner.list();
  }
}

export function newCachedChallengeForecastStore(inner: ChallengeForecastStore, ttl: number, clockValue: clock.Clock): ChallengeForecastStore {
  return new CachedChallengeForecastStore(inner, cache.newTtlCache<ChallengeForecast>(512, ttl, clockValue), 0, 0);
}

/** Selects challenge forecasts. Empty fields match all. */
export class ChallengeForecastQuery {
  name: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minVersion: number, statuses: string[], limit: number) {
    this.name = name;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ChallengeForecast): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ChallengeForecast[]): ChallengeForecast[] {
    const matched = collections.filter(items, (candidate: ChallengeForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findChallengeForecasts(store: ChallengeForecastStore, query: ChallengeForecastQuery): ChallengeForecast[] {
  return query.apply(store.list());
}
