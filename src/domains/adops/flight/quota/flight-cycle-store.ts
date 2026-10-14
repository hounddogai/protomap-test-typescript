import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FlightCycle } from "./flight-cycle.js";

/** Keeps flight cycles by code. */
export interface FlightCycleStore {
  find(code: string): FlightCycle | undefined;
  save(item: FlightCycle): void;
  remove(code: string): boolean;
  list(): FlightCycle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFlightCycleStore implements FlightCycleStore {
  items: Map<string, FlightCycle>;
  order: string[];

  constructor(items: Map<string, FlightCycle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FlightCycle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FlightCycle): void {
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

  list(): FlightCycle[] {
    const out: FlightCycle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFlightCycleStore(): FlightCycleStore {
  return new MemoryFlightCycleStore(new Map<string, FlightCycle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFlightCycleStore implements FlightCycleStore {
  inner: FlightCycleStore;
  cache: cache.TtlCache<FlightCycle>;
  hits: number;
  misses: number;

  constructor(inner: FlightCycleStore, cacheValue: cache.TtlCache<FlightCycle>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FlightCycle | undefined {
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

  save(item: FlightCycle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FlightCycle[] {
    return this.inner.list();
  }
}

export function newCachedFlightCycleStore(inner: FlightCycleStore, ttl: number, clockValue: clock.Clock): FlightCycleStore {
  return new CachedFlightCycleStore(inner, cache.newTtlCache<FlightCycle>(64, ttl, clockValue), 0, 0);
}

/** Selects flight cycles. Empty fields match all. */
export class FlightCycleQuery {
  source: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minThreshold: number, statuses: string[], limit: number) {
    this.source = source;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FlightCycle): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FlightCycle[]): FlightCycle[] {
    const matched = collections.filter(items, (candidate: FlightCycle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFlightCycles(store: FlightCycleStore, query: FlightCycleQuery): FlightCycle[] {
  return query.apply(store.list());
}
