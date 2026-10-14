import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { EscalationForecast } from "./escalation-forecast.js";

/** Keeps escalation forecasts by code. */
export interface EscalationForecastStore {
  find(code: string): EscalationForecast | undefined;
  save(item: EscalationForecast): void;
  remove(code: string): boolean;
  list(): EscalationForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryEscalationForecastStore implements EscalationForecastStore {
  items: Map<string, EscalationForecast>;
  order: string[];

  constructor(items: Map<string, EscalationForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): EscalationForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: EscalationForecast): void {
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

  list(): EscalationForecast[] {
    const out: EscalationForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryEscalationForecastStore(): EscalationForecastStore {
  return new MemoryEscalationForecastStore(new Map<string, EscalationForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedEscalationForecastStore implements EscalationForecastStore {
  inner: EscalationForecastStore;
  cache: cache.TtlCache<EscalationForecast>;
  hits: number;
  misses: number;

  constructor(
    inner: EscalationForecastStore,
    cacheValue: cache.TtlCache<EscalationForecast>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): EscalationForecast | undefined {
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

  save(item: EscalationForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): EscalationForecast[] {
    return this.inner.list();
  }
}

export function newCachedEscalationForecastStore(inner: EscalationForecastStore, ttl: number, clockValue: clock.Clock): EscalationForecastStore {
  return new CachedEscalationForecastStore(inner, cache.newTtlCache<EscalationForecast>(512, ttl, clockValue), 0, 0);
}

/** Selects escalation forecasts. Empty fields match all. */
export class EscalationForecastQuery {
  country: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.country = country;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: EscalationForecast): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: EscalationForecast[]): EscalationForecast[] {
    const matched = collections.filter(items, (candidate: EscalationForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findEscalationForecasts(store: EscalationForecastStore, query: EscalationForecastQuery): EscalationForecast[] {
  return query.apply(store.list());
}
