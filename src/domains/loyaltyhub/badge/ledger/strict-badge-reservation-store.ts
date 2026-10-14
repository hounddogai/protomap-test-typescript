import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictBadgeReservation } from "./strict-badge-reservation.js";

/** Keeps strict badge reservations by code. */
export interface StrictBadgeReservationStore {
  find(code: string): StrictBadgeReservation | undefined;
  save(item: StrictBadgeReservation): void;
  remove(code: string): boolean;
  list(): StrictBadgeReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictBadgeReservationStore implements StrictBadgeReservationStore {
  items: Map<string, StrictBadgeReservation>;
  order: string[];

  constructor(items: Map<string, StrictBadgeReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictBadgeReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictBadgeReservation): void {
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

  list(): StrictBadgeReservation[] {
    const out: StrictBadgeReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictBadgeReservationStore(): StrictBadgeReservationStore {
  return new MemoryStrictBadgeReservationStore(new Map<string, StrictBadgeReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictBadgeReservationStore implements StrictBadgeReservationStore {
  inner: StrictBadgeReservationStore;
  cache: cache.TtlCache<StrictBadgeReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictBadgeReservationStore,
    cacheValue: cache.TtlCache<StrictBadgeReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictBadgeReservation | undefined {
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

  save(item: StrictBadgeReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictBadgeReservation[] {
    return this.inner.list();
  }
}

export function newCachedStrictBadgeReservationStore(inner: StrictBadgeReservationStore, ttl: number, clockValue: clock.Clock): StrictBadgeReservationStore {
  return new CachedStrictBadgeReservationStore(
    inner,
    cache.newTtlCache<StrictBadgeReservation>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects strict badge reservations. Empty fields match all. */
export class StrictBadgeReservationQuery {
  locale: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minWeight: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictBadgeReservation): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictBadgeReservation[]): StrictBadgeReservation[] {
    const matched = collections.filter(items, (candidate: StrictBadgeReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictBadgeReservations(store: StrictBadgeReservationStore, query: StrictBadgeReservationQuery): StrictBadgeReservation[] {
  return query.apply(store.list());
}
