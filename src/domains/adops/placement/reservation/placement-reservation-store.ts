import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PlacementReservation } from "./placement-reservation.js";

/** Keeps placement reservations by code. */
export interface PlacementReservationStore {
  find(code: string): PlacementReservation | undefined;
  save(item: PlacementReservation): void;
  remove(code: string): boolean;
  list(): PlacementReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPlacementReservationStore implements PlacementReservationStore {
  items: Map<string, PlacementReservation>;
  order: string[];

  constructor(items: Map<string, PlacementReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PlacementReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PlacementReservation): void {
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

  list(): PlacementReservation[] {
    const out: PlacementReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPlacementReservationStore(): PlacementReservationStore {
  return new MemoryPlacementReservationStore(new Map<string, PlacementReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPlacementReservationStore implements PlacementReservationStore {
  inner: PlacementReservationStore;
  cache: cache.TtlCache<PlacementReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: PlacementReservationStore,
    cacheValue: cache.TtlCache<PlacementReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PlacementReservation | undefined {
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

  save(item: PlacementReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PlacementReservation[] {
    return this.inner.list();
  }
}

export function newCachedPlacementReservationStore(inner: PlacementReservationStore, ttl: number, clockValue: clock.Clock): PlacementReservationStore {
  return new CachedPlacementReservationStore(
    inner,
    cache.newTtlCache<PlacementReservation>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects placement reservations. Empty fields match all. */
export class PlacementReservationQuery {
  source: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minAmount: number, statuses: string[], limit: number) {
    this.source = source;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PlacementReservation): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PlacementReservation[]): PlacementReservation[] {
    const matched = collections.filter(items, (candidate: PlacementReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPlacementReservations(store: PlacementReservationStore, query: PlacementReservationQuery): PlacementReservation[] {
  return query.apply(store.list());
}
