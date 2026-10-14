import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FlightOverride } from "./flight-override.js";

/** Keeps flight overrides by code. */
export interface FlightOverrideStore {
  find(code: string): FlightOverride | undefined;
  save(item: FlightOverride): void;
  remove(code: string): boolean;
  list(): FlightOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFlightOverrideStore implements FlightOverrideStore {
  items: Map<string, FlightOverride>;
  order: string[];

  constructor(items: Map<string, FlightOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FlightOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FlightOverride): void {
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

  list(): FlightOverride[] {
    const out: FlightOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFlightOverrideStore(): FlightOverrideStore {
  return new MemoryFlightOverrideStore(new Map<string, FlightOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFlightOverrideStore implements FlightOverrideStore {
  inner: FlightOverrideStore;
  cache: cache.TtlCache<FlightOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: FlightOverrideStore,
    cacheValue: cache.TtlCache<FlightOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FlightOverride | undefined {
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

  save(item: FlightOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FlightOverride[] {
    return this.inner.list();
  }
}

export function newCachedFlightOverrideStore(inner: FlightOverrideStore, ttl: number, clockValue: clock.Clock): FlightOverrideStore {
  return new CachedFlightOverrideStore(inner, cache.newTtlCache<FlightOverride>(128, ttl, clockValue), 0, 0);
}

/** Selects flight overrides. Empty fields match all. */
export class FlightOverrideQuery {
  locale: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minBid: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FlightOverride): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FlightOverride[]): FlightOverride[] {
    const matched = collections.filter(items, (candidate: FlightOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFlightOverrides(store: FlightOverrideStore, query: FlightOverrideQuery): FlightOverride[] {
  return query.apply(store.list());
}
