import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredPlacementReservation } from "./tiered-placement-reservation.js";

/** Keeps tiered placement reservations by code. */
export interface TieredPlacementReservationStore {
  find(code: string): TieredPlacementReservation | undefined;
  save(item: TieredPlacementReservation): void;
  remove(code: string): boolean;
  list(): TieredPlacementReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredPlacementReservationStore implements TieredPlacementReservationStore {
  items: Map<string, TieredPlacementReservation>;
  order: string[];

  constructor(items: Map<string, TieredPlacementReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredPlacementReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredPlacementReservation): void {
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

  list(): TieredPlacementReservation[] {
    const out: TieredPlacementReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredPlacementReservationStore(): TieredPlacementReservationStore {
  return new MemoryTieredPlacementReservationStore(new Map<string, TieredPlacementReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredPlacementReservationStore implements TieredPlacementReservationStore {
  inner: TieredPlacementReservationStore;
  cache: cache.TtlCache<TieredPlacementReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredPlacementReservationStore,
    cacheValue: cache.TtlCache<TieredPlacementReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredPlacementReservation | undefined {
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

  save(item: TieredPlacementReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredPlacementReservation[] {
    return this.inner.list();
  }
}

export function newCachedTieredPlacementReservationStore(inner: TieredPlacementReservationStore, ttl: number, clockValue: clock.Clock): TieredPlacementReservationStore {
  return new CachedTieredPlacementReservationStore(
    inner,
    cache.newTtlCache<TieredPlacementReservation>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered placement reservations. Empty fields match all. */
export class TieredPlacementReservationQuery {
  country: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minMargin: number, statuses: string[], limit: number) {
    this.country = country;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredPlacementReservation): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredPlacementReservation[]): TieredPlacementReservation[] {
    const matched = collections.filter(items, (candidate: TieredPlacementReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredPlacementReservations(store: TieredPlacementReservationStore, query: TieredPlacementReservationQuery): TieredPlacementReservation[] {
  return query.apply(store.list());
}
