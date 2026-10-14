import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CreditReservation } from "./credit-reservation.js";

/** Keeps credit reservations by code. */
export interface CreditReservationStore {
  find(code: string): CreditReservation | undefined;
  save(item: CreditReservation): void;
  remove(code: string): boolean;
  list(): CreditReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCreditReservationStore implements CreditReservationStore {
  items: Map<string, CreditReservation>;
  order: string[];

  constructor(items: Map<string, CreditReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CreditReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CreditReservation): void {
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

  list(): CreditReservation[] {
    const out: CreditReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCreditReservationStore(): CreditReservationStore {
  return new MemoryCreditReservationStore(new Map<string, CreditReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCreditReservationStore implements CreditReservationStore {
  inner: CreditReservationStore;
  cache: cache.TtlCache<CreditReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: CreditReservationStore,
    cacheValue: cache.TtlCache<CreditReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CreditReservation | undefined {
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

  save(item: CreditReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CreditReservation[] {
    return this.inner.list();
  }
}

export function newCachedCreditReservationStore(inner: CreditReservationStore, ttl: number, clockValue: clock.Clock): CreditReservationStore {
  return new CachedCreditReservationStore(inner, cache.newTtlCache<CreditReservation>(256, ttl, clockValue), 0, 0);
}

/** Selects credit reservations. Empty fields match all. */
export class CreditReservationQuery {
  utmSource: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minMinimum: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CreditReservation): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CreditReservation[]): CreditReservation[] {
    const matched = collections.filter(items, (candidate: CreditReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCreditReservations(store: CreditReservationStore, query: CreditReservationQuery): CreditReservation[] {
  return query.apply(store.list());
}
