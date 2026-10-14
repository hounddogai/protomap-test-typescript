import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualConversionReservation } from "./manual-conversion-reservation.js";

/** Keeps manual conversion reservations by code. */
export interface ManualConversionReservationStore {
  find(code: string): ManualConversionReservation | undefined;
  save(item: ManualConversionReservation): void;
  remove(code: string): boolean;
  list(): ManualConversionReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualConversionReservationStore implements ManualConversionReservationStore {
  items: Map<string, ManualConversionReservation>;
  order: string[];

  constructor(items: Map<string, ManualConversionReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualConversionReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualConversionReservation): void {
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

  list(): ManualConversionReservation[] {
    const out: ManualConversionReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualConversionReservationStore(): ManualConversionReservationStore {
  return new MemoryManualConversionReservationStore(new Map<string, ManualConversionReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualConversionReservationStore implements ManualConversionReservationStore {
  inner: ManualConversionReservationStore;
  cache: cache.TtlCache<ManualConversionReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualConversionReservationStore,
    cacheValue: cache.TtlCache<ManualConversionReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualConversionReservation | undefined {
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

  save(item: ManualConversionReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualConversionReservation[] {
    return this.inner.list();
  }
}

export function newCachedManualConversionReservationStore(inner: ManualConversionReservationStore, ttl: number, clockValue: clock.Clock): ManualConversionReservationStore {
  return new CachedManualConversionReservationStore(
    inner,
    cache.newTtlCache<ManualConversionReservation>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects manual conversion reservations. Empty fields match all. */
export class ManualConversionReservationQuery {
  name: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualConversionReservation): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualConversionReservation[]): ManualConversionReservation[] {
    const matched = collections.filter(items, (candidate: ManualConversionReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualConversionReservations(store: ManualConversionReservationStore, query: ManualConversionReservationQuery): ManualConversionReservation[] {
  return query.apply(store.list());
}
