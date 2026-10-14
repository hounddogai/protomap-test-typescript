import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimarySlaReservation } from "./primary-sla-reservation.js";

/** Keeps primary sla reservations by code. */
export interface PrimarySlaReservationStore {
  find(code: string): PrimarySlaReservation | undefined;
  save(item: PrimarySlaReservation): void;
  remove(code: string): boolean;
  list(): PrimarySlaReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimarySlaReservationStore implements PrimarySlaReservationStore {
  items: Map<string, PrimarySlaReservation>;
  order: string[];

  constructor(items: Map<string, PrimarySlaReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimarySlaReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimarySlaReservation): void {
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

  list(): PrimarySlaReservation[] {
    const out: PrimarySlaReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimarySlaReservationStore(): PrimarySlaReservationStore {
  return new MemoryPrimarySlaReservationStore(new Map<string, PrimarySlaReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimarySlaReservationStore implements PrimarySlaReservationStore {
  inner: PrimarySlaReservationStore;
  cache: cache.TtlCache<PrimarySlaReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimarySlaReservationStore,
    cacheValue: cache.TtlCache<PrimarySlaReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimarySlaReservation | undefined {
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

  save(item: PrimarySlaReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimarySlaReservation[] {
    return this.inner.list();
  }
}

export function newCachedPrimarySlaReservationStore(inner: PrimarySlaReservationStore, ttl: number, clockValue: clock.Clock): PrimarySlaReservationStore {
  return new CachedPrimarySlaReservationStore(
    inner,
    cache.newTtlCache<PrimarySlaReservation>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary sla reservations. Empty fields match all. */
export class PrimarySlaReservationQuery {
  locale: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minFloorValue: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimarySlaReservation): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimarySlaReservation[]): PrimarySlaReservation[] {
    const matched = collections.filter(items, (candidate: PrimarySlaReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimarySlaReservations(store: PrimarySlaReservationStore, query: PrimarySlaReservationQuery): PrimarySlaReservation[] {
  return query.apply(store.list());
}
