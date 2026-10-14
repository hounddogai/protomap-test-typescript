import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PaywallReservation } from "./paywall-reservation.js";

/** Keeps paywall reservations by code. */
export interface PaywallReservationStore {
  find(code: string): PaywallReservation | undefined;
  save(item: PaywallReservation): void;
  remove(code: string): boolean;
  list(): PaywallReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPaywallReservationStore implements PaywallReservationStore {
  items: Map<string, PaywallReservation>;
  order: string[];

  constructor(items: Map<string, PaywallReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PaywallReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PaywallReservation): void {
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

  list(): PaywallReservation[] {
    const out: PaywallReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPaywallReservationStore(): PaywallReservationStore {
  return new MemoryPaywallReservationStore(new Map<string, PaywallReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPaywallReservationStore implements PaywallReservationStore {
  inner: PaywallReservationStore;
  cache: cache.TtlCache<PaywallReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: PaywallReservationStore,
    cacheValue: cache.TtlCache<PaywallReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PaywallReservation | undefined {
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

  save(item: PaywallReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PaywallReservation[] {
    return this.inner.list();
  }
}

export function newCachedPaywallReservationStore(inner: PaywallReservationStore, ttl: number, clockValue: clock.Clock): PaywallReservationStore {
  return new CachedPaywallReservationStore(inner, cache.newTtlCache<PaywallReservation>(1024, ttl, clockValue), 0, 0);
}

/** Selects paywall reservations. Empty fields match all. */
export class PaywallReservationQuery {
  name: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minGraceDays: number, statuses: string[], limit: number) {
    this.name = name;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PaywallReservation): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PaywallReservation[]): PaywallReservation[] {
    const matched = collections.filter(items, (candidate: PaywallReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPaywallReservations(store: PaywallReservationStore, query: PaywallReservationQuery): PaywallReservation[] {
  return query.apply(store.list());
}
