import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { InviteReservation } from "./invite-reservation.js";

/** Keeps invite reservations by code. */
export interface InviteReservationStore {
  find(code: string): InviteReservation | undefined;
  save(item: InviteReservation): void;
  remove(code: string): boolean;
  list(): InviteReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryInviteReservationStore implements InviteReservationStore {
  items: Map<string, InviteReservation>;
  order: string[];

  constructor(items: Map<string, InviteReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): InviteReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: InviteReservation): void {
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

  list(): InviteReservation[] {
    const out: InviteReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryInviteReservationStore(): InviteReservationStore {
  return new MemoryInviteReservationStore(new Map<string, InviteReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedInviteReservationStore implements InviteReservationStore {
  inner: InviteReservationStore;
  cache: cache.TtlCache<InviteReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: InviteReservationStore,
    cacheValue: cache.TtlCache<InviteReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): InviteReservation | undefined {
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

  save(item: InviteReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): InviteReservation[] {
    return this.inner.list();
  }
}

export function newCachedInviteReservationStore(inner: InviteReservationStore, ttl: number, clockValue: clock.Clock): InviteReservationStore {
  return new CachedInviteReservationStore(inner, cache.newTtlCache<InviteReservation>(256, ttl, clockValue), 0, 0);
}

/** Selects invite reservations. Empty fields match all. */
export class InviteReservationQuery {
  region: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minLimit: number, statuses: string[], limit: number) {
    this.region = region;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: InviteReservation): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: InviteReservation[]): InviteReservation[] {
    const matched = collections.filter(items, (candidate: InviteReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findInviteReservations(store: InviteReservationStore, query: InviteReservationQuery): InviteReservation[] {
  return query.apply(store.list());
}
