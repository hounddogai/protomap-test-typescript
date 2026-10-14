import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FlightClaim } from "./flight-claim.js";

/** Keeps flight claims by code. */
export interface FlightClaimStore {
  find(code: string): FlightClaim | undefined;
  save(item: FlightClaim): void;
  remove(code: string): boolean;
  list(): FlightClaim[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFlightClaimStore implements FlightClaimStore {
  items: Map<string, FlightClaim>;
  order: string[];

  constructor(items: Map<string, FlightClaim>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FlightClaim | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FlightClaim): void {
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

  list(): FlightClaim[] {
    const out: FlightClaim[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFlightClaimStore(): FlightClaimStore {
  return new MemoryFlightClaimStore(new Map<string, FlightClaim>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFlightClaimStore implements FlightClaimStore {
  inner: FlightClaimStore;
  cache: cache.TtlCache<FlightClaim>;
  hits: number;
  misses: number;

  constructor(inner: FlightClaimStore, cacheValue: cache.TtlCache<FlightClaim>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FlightClaim | undefined {
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

  save(item: FlightClaim): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FlightClaim[] {
    return this.inner.list();
  }
}

export function newCachedFlightClaimStore(inner: FlightClaimStore, ttl: number, clockValue: clock.Clock): FlightClaimStore {
  return new CachedFlightClaimStore(inner, cache.newTtlCache<FlightClaim>(128, ttl, clockValue), 0, 0);
}

/** Selects flight claims. Empty fields match all. */
export class FlightClaimQuery {
  source: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minScore: number, statuses: string[], limit: number) {
    this.source = source;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FlightClaim): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FlightClaim[]): FlightClaim[] {
    const matched = collections.filter(items, (candidate: FlightClaim): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFlightClaims(store: FlightClaimStore, query: FlightClaimQuery): FlightClaim[] {
  return query.apply(store.list());
}
