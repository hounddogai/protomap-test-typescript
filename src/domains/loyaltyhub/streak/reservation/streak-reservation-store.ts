import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StreakReservation } from "./streak-reservation.js";

/** Keeps streak reservations by code. */
export interface StreakReservationStore {
  find(code: string): StreakReservation | undefined;
  save(item: StreakReservation): void;
  remove(code: string): boolean;
  list(): StreakReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStreakReservationStore implements StreakReservationStore {
  items: Map<string, StreakReservation>;
  order: string[];

  constructor(items: Map<string, StreakReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StreakReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StreakReservation): void {
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

  list(): StreakReservation[] {
    const out: StreakReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStreakReservationStore(): StreakReservationStore {
  return new MemoryStreakReservationStore(new Map<string, StreakReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStreakReservationStore implements StreakReservationStore {
  inner: StreakReservationStore;
  cache: cache.TtlCache<StreakReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: StreakReservationStore,
    cacheValue: cache.TtlCache<StreakReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StreakReservation | undefined {
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

  save(item: StreakReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StreakReservation[] {
    return this.inner.list();
  }
}

export function newCachedStreakReservationStore(inner: StreakReservationStore, ttl: number, clockValue: clock.Clock): StreakReservationStore {
  return new CachedStreakReservationStore(inner, cache.newTtlCache<StreakReservation>(64, ttl, clockValue), 0, 0);
}

/** Selects streak reservations. Empty fields match all. */
export class StreakReservationQuery {
  label: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minMinimum: number, statuses: string[], limit: number) {
    this.label = label;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StreakReservation): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StreakReservation[]): StreakReservation[] {
    const matched = collections.filter(items, (candidate: StreakReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStreakReservations(store: StreakReservationStore, query: StreakReservationQuery): StreakReservation[] {
  return query.apply(store.list());
}
