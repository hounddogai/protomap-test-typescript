import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ProofForecast } from "./proof-forecast.js";

/** Keeps proof forecasts by code. */
export interface ProofForecastStore {
  find(code: string): ProofForecast | undefined;
  save(item: ProofForecast): void;
  remove(code: string): boolean;
  list(): ProofForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryProofForecastStore implements ProofForecastStore {
  items: Map<string, ProofForecast>;
  order: string[];

  constructor(items: Map<string, ProofForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ProofForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ProofForecast): void {
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

  list(): ProofForecast[] {
    const out: ProofForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryProofForecastStore(): ProofForecastStore {
  return new MemoryProofForecastStore(new Map<string, ProofForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedProofForecastStore implements ProofForecastStore {
  inner: ProofForecastStore;
  cache: cache.TtlCache<ProofForecast>;
  hits: number;
  misses: number;

  constructor(inner: ProofForecastStore, cacheValue: cache.TtlCache<ProofForecast>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ProofForecast | undefined {
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

  save(item: ProofForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ProofForecast[] {
    return this.inner.list();
  }
}

export function newCachedProofForecastStore(inner: ProofForecastStore, ttl: number, clockValue: clock.Clock): ProofForecastStore {
  return new CachedProofForecastStore(inner, cache.newTtlCache<ProofForecast>(128, ttl, clockValue), 0, 0);
}

/** Selects proof forecasts. Empty fields match all. */
export class ProofForecastQuery {
  region: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minGraceDays: number, statuses: string[], limit: number) {
    this.region = region;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ProofForecast): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ProofForecast[]): ProofForecast[] {
    const matched = collections.filter(items, (candidate: ProofForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findProofForecasts(store: ProofForecastStore, query: ProofForecastQuery): ProofForecast[] {
  return query.apply(store.list());
}
