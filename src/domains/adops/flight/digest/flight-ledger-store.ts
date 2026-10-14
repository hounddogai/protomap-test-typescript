import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FlightLedger } from "./flight-ledger.js";

/** Keeps flight ledgers by code. */
export interface FlightLedgerStore {
  find(code: string): FlightLedger | undefined;
  save(item: FlightLedger): void;
  remove(code: string): boolean;
  list(): FlightLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFlightLedgerStore implements FlightLedgerStore {
  items: Map<string, FlightLedger>;
  order: string[];

  constructor(items: Map<string, FlightLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FlightLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FlightLedger): void {
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

  list(): FlightLedger[] {
    const out: FlightLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFlightLedgerStore(): FlightLedgerStore {
  return new MemoryFlightLedgerStore(new Map<string, FlightLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFlightLedgerStore implements FlightLedgerStore {
  inner: FlightLedgerStore;
  cache: cache.TtlCache<FlightLedger>;
  hits: number;
  misses: number;

  constructor(inner: FlightLedgerStore, cacheValue: cache.TtlCache<FlightLedger>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FlightLedger | undefined {
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

  save(item: FlightLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FlightLedger[] {
    return this.inner.list();
  }
}

export function newCachedFlightLedgerStore(inner: FlightLedgerStore, ttl: number, clockValue: clock.Clock): FlightLedgerStore {
  return new CachedFlightLedgerStore(inner, cache.newTtlCache<FlightLedger>(1024, ttl, clockValue), 0, 0);
}

/** Selects flight ledgers. Empty fields match all. */
export class FlightLedgerQuery {
  title: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minLimit: number, statuses: string[], limit: number) {
    this.title = title;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FlightLedger): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FlightLedger[]): FlightLedger[] {
    const matched = collections.filter(items, (candidate: FlightLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFlightLedgers(store: FlightLedgerStore, query: FlightLedgerQuery): FlightLedger[] {
  return query.apply(store.list());
}
