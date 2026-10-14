import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FunnelReservation } from "./funnel-reservation.js";

/** Keeps funnel reservations by code. */
export interface FunnelReservationStore {
  find(code: string): FunnelReservation | undefined;
  save(item: FunnelReservation): void;
  remove(code: string): boolean;
  list(): FunnelReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFunnelReservationStore implements FunnelReservationStore {
  items: Map<string, FunnelReservation>;
  order: string[];

  constructor(items: Map<string, FunnelReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FunnelReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FunnelReservation): void {
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

  list(): FunnelReservation[] {
    const out: FunnelReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFunnelReservationStore(): FunnelReservationStore {
  return new MemoryFunnelReservationStore(new Map<string, FunnelReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFunnelReservationStore implements FunnelReservationStore {
  inner: FunnelReservationStore;
  cache: cache.TtlCache<FunnelReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: FunnelReservationStore,
    cacheValue: cache.TtlCache<FunnelReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FunnelReservation | undefined {
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

  save(item: FunnelReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FunnelReservation[] {
    return this.inner.list();
  }
}

export function newCachedFunnelReservationStore(inner: FunnelReservationStore, ttl: number, clockValue: clock.Clock): FunnelReservationStore {
  return new CachedFunnelReservationStore(inner, cache.newTtlCache<FunnelReservation>(256, ttl, clockValue), 0, 0);
}

/** Selects funnel reservations. Empty fields match all. */
export class FunnelReservationQuery {
  channel: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minAmount: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FunnelReservation): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FunnelReservation[]): FunnelReservation[] {
    const matched = collections.filter(items, (candidate: FunnelReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFunnelReservations(store: FunnelReservationStore, query: FunnelReservationQuery): FunnelReservation[] {
  return query.apply(store.list());
}
