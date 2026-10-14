import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FlightWindow } from "./flight-window.js";

/** Keeps flight windows by code. */
export interface FlightWindowStore {
  find(code: string): FlightWindow | undefined;
  save(item: FlightWindow): void;
  remove(code: string): boolean;
  list(): FlightWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFlightWindowStore implements FlightWindowStore {
  items: Map<string, FlightWindow>;
  order: string[];

  constructor(items: Map<string, FlightWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FlightWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FlightWindow): void {
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

  list(): FlightWindow[] {
    const out: FlightWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFlightWindowStore(): FlightWindowStore {
  return new MemoryFlightWindowStore(new Map<string, FlightWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFlightWindowStore implements FlightWindowStore {
  inner: FlightWindowStore;
  cache: cache.TtlCache<FlightWindow>;
  hits: number;
  misses: number;

  constructor(inner: FlightWindowStore, cacheValue: cache.TtlCache<FlightWindow>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FlightWindow | undefined {
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

  save(item: FlightWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FlightWindow[] {
    return this.inner.list();
  }
}

export function newCachedFlightWindowStore(inner: FlightWindowStore, ttl: number, clockValue: clock.Clock): FlightWindowStore {
  return new CachedFlightWindowStore(inner, cache.newTtlCache<FlightWindow>(256, ttl, clockValue), 0, 0);
}

/** Selects flight windows. Empty fields match all. */
export class FlightWindowQuery {
  channel: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minRate: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FlightWindow): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FlightWindow[]): FlightWindow[] {
    const matched = collections.filter(items, (candidate: FlightWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFlightWindows(store: FlightWindowStore, query: FlightWindowQuery): FlightWindow[] {
  return query.apply(store.list());
}
