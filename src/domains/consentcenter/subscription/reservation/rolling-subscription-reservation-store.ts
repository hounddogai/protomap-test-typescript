import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingSubscriptionReservation } from "./rolling-subscription-reservation.js";

/** Keeps rolling subscription reservations by code. */
export interface RollingSubscriptionReservationStore {
  find(code: string): RollingSubscriptionReservation | undefined;
  save(item: RollingSubscriptionReservation): void;
  remove(code: string): boolean;
  list(): RollingSubscriptionReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingSubscriptionReservationStore implements RollingSubscriptionReservationStore {
  items: Map<string, RollingSubscriptionReservation>;
  order: string[];

  constructor(items: Map<string, RollingSubscriptionReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingSubscriptionReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingSubscriptionReservation): void {
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

  list(): RollingSubscriptionReservation[] {
    const out: RollingSubscriptionReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingSubscriptionReservationStore(): RollingSubscriptionReservationStore {
  return new MemoryRollingSubscriptionReservationStore(new Map<string, RollingSubscriptionReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingSubscriptionReservationStore implements RollingSubscriptionReservationStore {
  inner: RollingSubscriptionReservationStore;
  cache: cache.TtlCache<RollingSubscriptionReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingSubscriptionReservationStore,
    cacheValue: cache.TtlCache<RollingSubscriptionReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingSubscriptionReservation | undefined {
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

  save(item: RollingSubscriptionReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingSubscriptionReservation[] {
    return this.inner.list();
  }
}

export function newCachedRollingSubscriptionReservationStore(inner: RollingSubscriptionReservationStore, ttl: number, clockValue: clock.Clock): RollingSubscriptionReservationStore {
  return new CachedRollingSubscriptionReservationStore(
    inner,
    cache.newTtlCache<RollingSubscriptionReservation>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling subscription reservations. Empty fields match all. */
export class RollingSubscriptionReservationQuery {
  channel: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minWindowDays: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingSubscriptionReservation): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingSubscriptionReservation[]): RollingSubscriptionReservation[] {
    const matched = collections.filter(items, (candidate: RollingSubscriptionReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingSubscriptionReservations(store: RollingSubscriptionReservationStore, query: RollingSubscriptionReservationQuery): RollingSubscriptionReservation[] {
  return query.apply(store.list());
}
