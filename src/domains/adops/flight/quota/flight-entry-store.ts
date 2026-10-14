import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FlightEntry } from "./flight-entry.js";

/** Keeps flight entries by code. */
export interface FlightEntryStore {
  find(code: string): FlightEntry | undefined;
  save(item: FlightEntry): void;
  remove(code: string): boolean;
  list(): FlightEntry[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFlightEntryStore implements FlightEntryStore {
  items: Map<string, FlightEntry>;
  order: string[];

  constructor(items: Map<string, FlightEntry>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FlightEntry | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FlightEntry): void {
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

  list(): FlightEntry[] {
    const out: FlightEntry[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFlightEntryStore(): FlightEntryStore {
  return new MemoryFlightEntryStore(new Map<string, FlightEntry>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFlightEntryStore implements FlightEntryStore {
  inner: FlightEntryStore;
  cache: cache.TtlCache<FlightEntry>;
  hits: number;
  misses: number;

  constructor(inner: FlightEntryStore, cacheValue: cache.TtlCache<FlightEntry>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FlightEntry | undefined {
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

  save(item: FlightEntry): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FlightEntry[] {
    return this.inner.list();
  }
}

export function newCachedFlightEntryStore(inner: FlightEntryStore, ttl: number, clockValue: clock.Clock): FlightEntryStore {
  return new CachedFlightEntryStore(inner, cache.newTtlCache<FlightEntry>(512, ttl, clockValue), 0, 0);
}

/** Selects flight entries. Empty fields match all. */
export class FlightEntryQuery {
  label: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.label = label;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FlightEntry): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FlightEntry[]): FlightEntry[] {
    const matched = collections.filter(items, (candidate: FlightEntry): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFlightEntries(store: FlightEntryStore, query: FlightEntryQuery): FlightEntry[] {
  return query.apply(store.list());
}
