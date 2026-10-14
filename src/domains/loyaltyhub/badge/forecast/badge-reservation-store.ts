import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BadgeReservation } from "./badge-reservation.js";

/** Keeps badge reservations by code. */
export interface BadgeReservationStore {
  find(code: string): BadgeReservation | undefined;
  save(item: BadgeReservation): void;
  remove(code: string): boolean;
  list(): BadgeReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBadgeReservationStore implements BadgeReservationStore {
  items: Map<string, BadgeReservation>;
  order: string[];

  constructor(items: Map<string, BadgeReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BadgeReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BadgeReservation): void {
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

  list(): BadgeReservation[] {
    const out: BadgeReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBadgeReservationStore(): BadgeReservationStore {
  return new MemoryBadgeReservationStore(new Map<string, BadgeReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBadgeReservationStore implements BadgeReservationStore {
  inner: BadgeReservationStore;
  cache: cache.TtlCache<BadgeReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: BadgeReservationStore,
    cacheValue: cache.TtlCache<BadgeReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BadgeReservation | undefined {
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

  save(item: BadgeReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BadgeReservation[] {
    return this.inner.list();
  }
}

export function newCachedBadgeReservationStore(inner: BadgeReservationStore, ttl: number, clockValue: clock.Clock): BadgeReservationStore {
  return new CachedBadgeReservationStore(inner, cache.newTtlCache<BadgeReservation>(512, ttl, clockValue), 0, 0);
}

/** Selects badge reservations. Empty fields match all. */
export class BadgeReservationQuery {
  label: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minFloorValue: number, statuses: string[], limit: number) {
    this.label = label;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BadgeReservation): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BadgeReservation[]): BadgeReservation[] {
    const matched = collections.filter(items, (candidate: BadgeReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBadgeReservations(store: BadgeReservationStore, query: BadgeReservationQuery): BadgeReservation[] {
  return query.apply(store.list());
}
