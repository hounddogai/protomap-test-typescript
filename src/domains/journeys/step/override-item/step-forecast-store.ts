import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StepForecast } from "./step-forecast.js";

/** Keeps step forecasts by code. */
export interface StepForecastStore {
  find(code: string): StepForecast | undefined;
  save(item: StepForecast): void;
  remove(code: string): boolean;
  list(): StepForecast[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStepForecastStore implements StepForecastStore {
  items: Map<string, StepForecast>;
  order: string[];

  constructor(items: Map<string, StepForecast>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StepForecast | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StepForecast): void {
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

  list(): StepForecast[] {
    const out: StepForecast[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStepForecastStore(): StepForecastStore {
  return new MemoryStepForecastStore(new Map<string, StepForecast>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStepForecastStore implements StepForecastStore {
  inner: StepForecastStore;
  cache: cache.TtlCache<StepForecast>;
  hits: number;
  misses: number;

  constructor(inner: StepForecastStore, cacheValue: cache.TtlCache<StepForecast>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StepForecast | undefined {
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

  save(item: StepForecast): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StepForecast[] {
    return this.inner.list();
  }
}

export function newCachedStepForecastStore(inner: StepForecastStore, ttl: number, clockValue: clock.Clock): StepForecastStore {
  return new CachedStepForecastStore(inner, cache.newTtlCache<StepForecast>(128, ttl, clockValue), 0, 0);
}

/** Selects step forecasts. Empty fields match all. */
export class StepForecastQuery {
  title: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.title = title;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StepForecast): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StepForecast[]): StepForecast[] {
    const matched = collections.filter(items, (candidate: StepForecast): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStepForecasts(store: StepForecastStore, query: StepForecastQuery): StepForecast[] {
  return query.apply(store.list());
}
