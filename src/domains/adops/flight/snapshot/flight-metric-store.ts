import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FlightMetric } from "./flight-metric.js";

/** Keeps flight metrics by code. */
export interface FlightMetricStore {
  find(code: string): FlightMetric | undefined;
  save(item: FlightMetric): void;
  remove(code: string): boolean;
  list(): FlightMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFlightMetricStore implements FlightMetricStore {
  items: Map<string, FlightMetric>;
  order: string[];

  constructor(items: Map<string, FlightMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FlightMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FlightMetric): void {
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

  list(): FlightMetric[] {
    const out: FlightMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFlightMetricStore(): FlightMetricStore {
  return new MemoryFlightMetricStore(new Map<string, FlightMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFlightMetricStore implements FlightMetricStore {
  inner: FlightMetricStore;
  cache: cache.TtlCache<FlightMetric>;
  hits: number;
  misses: number;

  constructor(inner: FlightMetricStore, cacheValue: cache.TtlCache<FlightMetric>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FlightMetric | undefined {
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

  save(item: FlightMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FlightMetric[] {
    return this.inner.list();
  }
}

export function newCachedFlightMetricStore(inner: FlightMetricStore, ttl: number, clockValue: clock.Clock): FlightMetricStore {
  return new CachedFlightMetricStore(inner, cache.newTtlCache<FlightMetric>(128, ttl, clockValue), 0, 0);
}

/** Selects flight metrics. Empty fields match all. */
export class FlightMetricQuery {
  name: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minAttempts: number, statuses: string[], limit: number) {
    this.name = name;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FlightMetric): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FlightMetric[]): FlightMetric[] {
    const matched = collections.filter(items, (candidate: FlightMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFlightMetrics(store: FlightMetricStore, query: FlightMetricQuery): FlightMetric[] {
  return query.apply(store.list());
}
