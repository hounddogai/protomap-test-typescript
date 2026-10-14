import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { OptOutReservation } from "./opt-out-reservation.js";

/** Keeps opt out reservations by code. */
export interface OptOutReservationStore {
  find(code: string): OptOutReservation | undefined;
  save(item: OptOutReservation): void;
  remove(code: string): boolean;
  list(): OptOutReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryOptOutReservationStore implements OptOutReservationStore {
  items: Map<string, OptOutReservation>;
  order: string[];

  constructor(items: Map<string, OptOutReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): OptOutReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: OptOutReservation): void {
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

  list(): OptOutReservation[] {
    const out: OptOutReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryOptOutReservationStore(): OptOutReservationStore {
  return new MemoryOptOutReservationStore(new Map<string, OptOutReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedOptOutReservationStore implements OptOutReservationStore {
  inner: OptOutReservationStore;
  cache: cache.TtlCache<OptOutReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: OptOutReservationStore,
    cacheValue: cache.TtlCache<OptOutReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): OptOutReservation | undefined {
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

  save(item: OptOutReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): OptOutReservation[] {
    return this.inner.list();
  }
}

export function newCachedOptOutReservationStore(inner: OptOutReservationStore, ttl: number, clockValue: clock.Clock): OptOutReservationStore {
  return new CachedOptOutReservationStore(inner, cache.newTtlCache<OptOutReservation>(1024, ttl, clockValue), 0, 0);
}

/** Selects opt out reservations. Empty fields match all. */
export class OptOutReservationQuery {
  region: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.region = region;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: OptOutReservation): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: OptOutReservation[]): OptOutReservation[] {
    const matched = collections.filter(items, (candidate: OptOutReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findOptOutReservations(store: OptOutReservationStore, query: OptOutReservationQuery): OptOutReservation[] {
  return query.apply(store.list());
}
