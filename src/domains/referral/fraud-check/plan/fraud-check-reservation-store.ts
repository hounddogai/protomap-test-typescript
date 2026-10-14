import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FraudCheckReservation } from "./fraud-check-reservation.js";

/** Keeps fraud check reservations by code. */
export interface FraudCheckReservationStore {
  find(code: string): FraudCheckReservation | undefined;
  save(item: FraudCheckReservation): void;
  remove(code: string): boolean;
  list(): FraudCheckReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFraudCheckReservationStore implements FraudCheckReservationStore {
  items: Map<string, FraudCheckReservation>;
  order: string[];

  constructor(items: Map<string, FraudCheckReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FraudCheckReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FraudCheckReservation): void {
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

  list(): FraudCheckReservation[] {
    const out: FraudCheckReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFraudCheckReservationStore(): FraudCheckReservationStore {
  return new MemoryFraudCheckReservationStore(new Map<string, FraudCheckReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFraudCheckReservationStore implements FraudCheckReservationStore {
  inner: FraudCheckReservationStore;
  cache: cache.TtlCache<FraudCheckReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: FraudCheckReservationStore,
    cacheValue: cache.TtlCache<FraudCheckReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FraudCheckReservation | undefined {
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

  save(item: FraudCheckReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FraudCheckReservation[] {
    return this.inner.list();
  }
}

export function newCachedFraudCheckReservationStore(inner: FraudCheckReservationStore, ttl: number, clockValue: clock.Clock): FraudCheckReservationStore {
  return new CachedFraudCheckReservationStore(
    inner,
    cache.newTtlCache<FraudCheckReservation>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fraud check reservations. Empty fields match all. */
export class FraudCheckReservationQuery {
  country: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minImpressions: number, statuses: string[], limit: number) {
    this.country = country;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FraudCheckReservation): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FraudCheckReservation[]): FraudCheckReservation[] {
    const matched = collections.filter(items, (candidate: FraudCheckReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFraudCheckReservations(store: FraudCheckReservationStore, query: FraudCheckReservationQuery): FraudCheckReservation[] {
  return query.apply(store.list());
}
