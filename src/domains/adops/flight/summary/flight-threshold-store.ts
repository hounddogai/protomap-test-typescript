import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FlightThreshold } from "./flight-threshold.js";

/** Keeps flight thresholds by code. */
export interface FlightThresholdStore {
  find(code: string): FlightThreshold | undefined;
  save(item: FlightThreshold): void;
  remove(code: string): boolean;
  list(): FlightThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFlightThresholdStore implements FlightThresholdStore {
  items: Map<string, FlightThreshold>;
  order: string[];

  constructor(items: Map<string, FlightThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FlightThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FlightThreshold): void {
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

  list(): FlightThreshold[] {
    const out: FlightThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFlightThresholdStore(): FlightThresholdStore {
  return new MemoryFlightThresholdStore(new Map<string, FlightThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFlightThresholdStore implements FlightThresholdStore {
  inner: FlightThresholdStore;
  cache: cache.TtlCache<FlightThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: FlightThresholdStore,
    cacheValue: cache.TtlCache<FlightThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FlightThreshold | undefined {
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

  save(item: FlightThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FlightThreshold[] {
    return this.inner.list();
  }
}

export function newCachedFlightThresholdStore(inner: FlightThresholdStore, ttl: number, clockValue: clock.Clock): FlightThresholdStore {
  return new CachedFlightThresholdStore(inner, cache.newTtlCache<FlightThreshold>(128, ttl, clockValue), 0, 0);
}

/** Selects flight thresholds. Empty fields match all. */
export class FlightThresholdQuery {
  source: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.source = source;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FlightThreshold): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FlightThreshold[]): FlightThreshold[] {
    const matched = collections.filter(items, (candidate: FlightThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFlightThresholds(store: FlightThresholdStore, query: FlightThresholdQuery): FlightThreshold[] {
  return query.apply(store.list());
}
