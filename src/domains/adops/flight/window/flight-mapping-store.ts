import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FlightMapping } from "./flight-mapping.js";

/** Keeps flight mappings by code. */
export interface FlightMappingStore {
  find(code: string): FlightMapping | undefined;
  save(item: FlightMapping): void;
  remove(code: string): boolean;
  list(): FlightMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFlightMappingStore implements FlightMappingStore {
  items: Map<string, FlightMapping>;
  order: string[];

  constructor(items: Map<string, FlightMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FlightMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FlightMapping): void {
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

  list(): FlightMapping[] {
    const out: FlightMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFlightMappingStore(): FlightMappingStore {
  return new MemoryFlightMappingStore(new Map<string, FlightMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFlightMappingStore implements FlightMappingStore {
  inner: FlightMappingStore;
  cache: cache.TtlCache<FlightMapping>;
  hits: number;
  misses: number;

  constructor(inner: FlightMappingStore, cacheValue: cache.TtlCache<FlightMapping>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FlightMapping | undefined {
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

  save(item: FlightMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FlightMapping[] {
    return this.inner.list();
  }
}

export function newCachedFlightMappingStore(inner: FlightMappingStore, ttl: number, clockValue: clock.Clock): FlightMappingStore {
  return new CachedFlightMappingStore(inner, cache.newTtlCache<FlightMapping>(1024, ttl, clockValue), 0, 0);
}

/** Selects flight mappings. Empty fields match all. */
export class FlightMappingQuery {
  name: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minSequence: number, statuses: string[], limit: number) {
    this.name = name;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FlightMapping): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FlightMapping[]): FlightMapping[] {
    const matched = collections.filter(items, (candidate: FlightMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFlightMappings(store: FlightMappingStore, query: FlightMappingQuery): FlightMapping[] {
  return query.apply(store.list());
}
