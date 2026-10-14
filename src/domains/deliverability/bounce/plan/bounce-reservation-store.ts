import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BounceReservation } from "./bounce-reservation.js";

/** Keeps bounce reservations by code. */
export interface BounceReservationStore {
  find(code: string): BounceReservation | undefined;
  save(item: BounceReservation): void;
  remove(code: string): boolean;
  list(): BounceReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBounceReservationStore implements BounceReservationStore {
  items: Map<string, BounceReservation>;
  order: string[];

  constructor(items: Map<string, BounceReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BounceReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BounceReservation): void {
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

  list(): BounceReservation[] {
    const out: BounceReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBounceReservationStore(): BounceReservationStore {
  return new MemoryBounceReservationStore(new Map<string, BounceReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBounceReservationStore implements BounceReservationStore {
  inner: BounceReservationStore;
  cache: cache.TtlCache<BounceReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: BounceReservationStore,
    cacheValue: cache.TtlCache<BounceReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BounceReservation | undefined {
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

  save(item: BounceReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BounceReservation[] {
    return this.inner.list();
  }
}

export function newCachedBounceReservationStore(inner: BounceReservationStore, ttl: number, clockValue: clock.Clock): BounceReservationStore {
  return new CachedBounceReservationStore(inner, cache.newTtlCache<BounceReservation>(1024, ttl, clockValue), 0, 0);
}

/** Selects bounce reservations. Empty fields match all. */
export class BounceReservationQuery {
  unit: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minGraceDays: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BounceReservation): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BounceReservation[]): BounceReservation[] {
    const matched = collections.filter(items, (candidate: BounceReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBounceReservations(store: BounceReservationStore, query: BounceReservationQuery): BounceReservation[] {
  return query.apply(store.list());
}
