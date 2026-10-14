import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryCreditReservation } from "./primary-credit-reservation.js";

/** Keeps primary credit reservations by code. */
export interface PrimaryCreditReservationStore {
  find(code: string): PrimaryCreditReservation | undefined;
  save(item: PrimaryCreditReservation): void;
  remove(code: string): boolean;
  list(): PrimaryCreditReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryCreditReservationStore implements PrimaryCreditReservationStore {
  items: Map<string, PrimaryCreditReservation>;
  order: string[];

  constructor(items: Map<string, PrimaryCreditReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryCreditReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryCreditReservation): void {
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

  list(): PrimaryCreditReservation[] {
    const out: PrimaryCreditReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryCreditReservationStore(): PrimaryCreditReservationStore {
  return new MemoryPrimaryCreditReservationStore(new Map<string, PrimaryCreditReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryCreditReservationStore implements PrimaryCreditReservationStore {
  inner: PrimaryCreditReservationStore;
  cache: cache.TtlCache<PrimaryCreditReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryCreditReservationStore,
    cacheValue: cache.TtlCache<PrimaryCreditReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryCreditReservation | undefined {
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

  save(item: PrimaryCreditReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryCreditReservation[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryCreditReservationStore(inner: PrimaryCreditReservationStore, ttl: number, clockValue: clock.Clock): PrimaryCreditReservationStore {
  return new CachedPrimaryCreditReservationStore(
    inner,
    cache.newTtlCache<PrimaryCreditReservation>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary credit reservations. Empty fields match all. */
export class PrimaryCreditReservationQuery {
  segment: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minImpressions: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryCreditReservation): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryCreditReservation[]): PrimaryCreditReservation[] {
    const matched = collections.filter(items, (candidate: PrimaryCreditReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryCreditReservations(store: PrimaryCreditReservationStore, query: PrimaryCreditReservationQuery): PrimaryCreditReservation[] {
  return query.apply(store.list());
}
