import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CohortReservation } from "./cohort-reservation.js";

/** Keeps cohort reservations by code. */
export interface CohortReservationStore {
  find(code: string): CohortReservation | undefined;
  save(item: CohortReservation): void;
  remove(code: string): boolean;
  list(): CohortReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCohortReservationStore implements CohortReservationStore {
  items: Map<string, CohortReservation>;
  order: string[];

  constructor(items: Map<string, CohortReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CohortReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CohortReservation): void {
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

  list(): CohortReservation[] {
    const out: CohortReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCohortReservationStore(): CohortReservationStore {
  return new MemoryCohortReservationStore(new Map<string, CohortReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCohortReservationStore implements CohortReservationStore {
  inner: CohortReservationStore;
  cache: cache.TtlCache<CohortReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: CohortReservationStore,
    cacheValue: cache.TtlCache<CohortReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CohortReservation | undefined {
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

  save(item: CohortReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CohortReservation[] {
    return this.inner.list();
  }
}

export function newCachedCohortReservationStore(inner: CohortReservationStore, ttl: number, clockValue: clock.Clock): CohortReservationStore {
  return new CachedCohortReservationStore(inner, cache.newTtlCache<CohortReservation>(128, ttl, clockValue), 0, 0);
}

/** Selects cohort reservations. Empty fields match all. */
export class CohortReservationQuery {
  locale: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minRatio: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CohortReservation): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CohortReservation[]): CohortReservation[] {
    const matched = collections.filter(items, (candidate: CohortReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCohortReservations(store: CohortReservationStore, query: CohortReservationQuery): CohortReservation[] {
  return query.apply(store.list());
}
