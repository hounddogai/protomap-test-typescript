import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PayoutReservation } from "./payout-reservation.js";

/** Keeps payout reservations by code. */
export interface PayoutReservationStore {
  find(code: string): PayoutReservation | undefined;
  save(item: PayoutReservation): void;
  remove(code: string): boolean;
  list(): PayoutReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPayoutReservationStore implements PayoutReservationStore {
  items: Map<string, PayoutReservation>;
  order: string[];

  constructor(items: Map<string, PayoutReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PayoutReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PayoutReservation): void {
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

  list(): PayoutReservation[] {
    const out: PayoutReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPayoutReservationStore(): PayoutReservationStore {
  return new MemoryPayoutReservationStore(new Map<string, PayoutReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPayoutReservationStore implements PayoutReservationStore {
  inner: PayoutReservationStore;
  cache: cache.TtlCache<PayoutReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: PayoutReservationStore,
    cacheValue: cache.TtlCache<PayoutReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PayoutReservation | undefined {
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

  save(item: PayoutReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PayoutReservation[] {
    return this.inner.list();
  }
}

export function newCachedPayoutReservationStore(inner: PayoutReservationStore, ttl: number, clockValue: clock.Clock): PayoutReservationStore {
  return new CachedPayoutReservationStore(inner, cache.newTtlCache<PayoutReservation>(256, ttl, clockValue), 0, 0);
}

/** Selects payout reservations. Empty fields match all. */
export class PayoutReservationQuery {
  locale: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minCeiling: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PayoutReservation): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PayoutReservation[]): PayoutReservation[] {
    const matched = collections.filter(items, (candidate: PayoutReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPayoutReservations(store: PayoutReservationStore, query: PayoutReservationQuery): PayoutReservation[] {
  return query.apply(store.list());
}
