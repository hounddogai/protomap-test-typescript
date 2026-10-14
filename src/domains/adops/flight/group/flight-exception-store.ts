import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FlightException } from "./flight-exception.js";

/** Keeps flight exceptions by code. */
export interface FlightExceptionStore {
  find(code: string): FlightException | undefined;
  save(item: FlightException): void;
  remove(code: string): boolean;
  list(): FlightException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFlightExceptionStore implements FlightExceptionStore {
  items: Map<string, FlightException>;
  order: string[];

  constructor(items: Map<string, FlightException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FlightException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FlightException): void {
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

  list(): FlightException[] {
    const out: FlightException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFlightExceptionStore(): FlightExceptionStore {
  return new MemoryFlightExceptionStore(new Map<string, FlightException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFlightExceptionStore implements FlightExceptionStore {
  inner: FlightExceptionStore;
  cache: cache.TtlCache<FlightException>;
  hits: number;
  misses: number;

  constructor(
    inner: FlightExceptionStore,
    cacheValue: cache.TtlCache<FlightException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FlightException | undefined {
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

  save(item: FlightException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FlightException[] {
    return this.inner.list();
  }
}

export function newCachedFlightExceptionStore(inner: FlightExceptionStore, ttl: number, clockValue: clock.Clock): FlightExceptionStore {
  return new CachedFlightExceptionStore(inner, cache.newTtlCache<FlightException>(128, ttl, clockValue), 0, 0);
}

/** Selects flight exceptions. Empty fields match all. */
export class FlightExceptionQuery {
  locale: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minAmount: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FlightException): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FlightException[]): FlightException[] {
    const matched = collections.filter(items, (candidate: FlightException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFlightExceptions(store: FlightExceptionStore, query: FlightExceptionQuery): FlightException[] {
  return query.apply(store.list());
}
