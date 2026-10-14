import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredBounceReservation } from "./tiered-bounce-reservation.js";

/** Keeps tiered bounce reservations by code. */
export interface TieredBounceReservationStore {
  find(code: string): TieredBounceReservation | undefined;
  save(item: TieredBounceReservation): void;
  remove(code: string): boolean;
  list(): TieredBounceReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredBounceReservationStore implements TieredBounceReservationStore {
  items: Map<string, TieredBounceReservation>;
  order: string[];

  constructor(items: Map<string, TieredBounceReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredBounceReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredBounceReservation): void {
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

  list(): TieredBounceReservation[] {
    const out: TieredBounceReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredBounceReservationStore(): TieredBounceReservationStore {
  return new MemoryTieredBounceReservationStore(new Map<string, TieredBounceReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredBounceReservationStore implements TieredBounceReservationStore {
  inner: TieredBounceReservationStore;
  cache: cache.TtlCache<TieredBounceReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredBounceReservationStore,
    cacheValue: cache.TtlCache<TieredBounceReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredBounceReservation | undefined {
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

  save(item: TieredBounceReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredBounceReservation[] {
    return this.inner.list();
  }
}

export function newCachedTieredBounceReservationStore(inner: TieredBounceReservationStore, ttl: number, clockValue: clock.Clock): TieredBounceReservationStore {
  return new CachedTieredBounceReservationStore(
    inner,
    cache.newTtlCache<TieredBounceReservation>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered bounce reservations. Empty fields match all. */
export class TieredBounceReservationQuery {
  label: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minCapacity: number, statuses: string[], limit: number) {
    this.label = label;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredBounceReservation): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredBounceReservation[]): TieredBounceReservation[] {
    const matched = collections.filter(items, (candidate: TieredBounceReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredBounceReservations(store: TieredBounceReservationStore, query: TieredBounceReservationQuery): TieredBounceReservation[] {
  return query.apply(store.list());
}
