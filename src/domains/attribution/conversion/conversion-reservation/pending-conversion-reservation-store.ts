import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingConversionReservation } from "./pending-conversion-reservation.js";

/** Keeps pending conversion reservations by code. */
export interface PendingConversionReservationStore {
  find(code: string): PendingConversionReservation | undefined;
  save(item: PendingConversionReservation): void;
  remove(code: string): boolean;
  list(): PendingConversionReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingConversionReservationStore implements PendingConversionReservationStore {
  items: Map<string, PendingConversionReservation>;
  order: string[];

  constructor(items: Map<string, PendingConversionReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingConversionReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingConversionReservation): void {
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

  list(): PendingConversionReservation[] {
    const out: PendingConversionReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingConversionReservationStore(): PendingConversionReservationStore {
  return new MemoryPendingConversionReservationStore(new Map<string, PendingConversionReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingConversionReservationStore implements PendingConversionReservationStore {
  inner: PendingConversionReservationStore;
  cache: cache.TtlCache<PendingConversionReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingConversionReservationStore,
    cacheValue: cache.TtlCache<PendingConversionReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingConversionReservation | undefined {
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

  save(item: PendingConversionReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingConversionReservation[] {
    return this.inner.list();
  }
}

export function newCachedPendingConversionReservationStore(inner: PendingConversionReservationStore, ttl: number, clockValue: clock.Clock): PendingConversionReservationStore {
  return new CachedPendingConversionReservationStore(
    inner,
    cache.newTtlCache<PendingConversionReservation>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending conversion reservations. Empty fields match all. */
export class PendingConversionReservationQuery {
  segment: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minEndsAt: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingConversionReservation): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingConversionReservation[]): PendingConversionReservation[] {
    const matched = collections.filter(items, (candidate: PendingConversionReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingConversionReservations(store: PendingConversionReservationStore, query: PendingConversionReservationQuery): PendingConversionReservation[] {
  return query.apply(store.list());
}
