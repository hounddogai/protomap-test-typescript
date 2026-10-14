import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FlightTier } from "./flight-tier.js";

/** Keeps flight tiers by code. */
export interface FlightTierStore {
  find(code: string): FlightTier | undefined;
  save(item: FlightTier): void;
  remove(code: string): boolean;
  list(): FlightTier[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFlightTierStore implements FlightTierStore {
  items: Map<string, FlightTier>;
  order: string[];

  constructor(items: Map<string, FlightTier>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FlightTier | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FlightTier): void {
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

  list(): FlightTier[] {
    const out: FlightTier[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFlightTierStore(): FlightTierStore {
  return new MemoryFlightTierStore(new Map<string, FlightTier>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFlightTierStore implements FlightTierStore {
  inner: FlightTierStore;
  cache: cache.TtlCache<FlightTier>;
  hits: number;
  misses: number;

  constructor(inner: FlightTierStore, cacheValue: cache.TtlCache<FlightTier>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FlightTier | undefined {
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

  save(item: FlightTier): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FlightTier[] {
    return this.inner.list();
  }
}

export function newCachedFlightTierStore(inner: FlightTierStore, ttl: number, clockValue: clock.Clock): FlightTierStore {
  return new CachedFlightTierStore(inner, cache.newTtlCache<FlightTier>(128, ttl, clockValue), 0, 0);
}

/** Selects flight tiers. Empty fields match all. */
export class FlightTierQuery {
  name: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minBudget: number, statuses: string[], limit: number) {
    this.name = name;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FlightTier): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FlightTier[]): FlightTier[] {
    const matched = collections.filter(items, (candidate: FlightTier): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFlightTiers(store: FlightTierStore, query: FlightTierQuery): FlightTier[] {
  return query.apply(store.list());
}
