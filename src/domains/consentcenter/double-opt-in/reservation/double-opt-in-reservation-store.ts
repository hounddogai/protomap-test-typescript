import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DoubleOptInReservation } from "./double-opt-in-reservation.js";

/** Keeps double opt in reservations by code. */
export interface DoubleOptInReservationStore {
  find(code: string): DoubleOptInReservation | undefined;
  save(item: DoubleOptInReservation): void;
  remove(code: string): boolean;
  list(): DoubleOptInReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDoubleOptInReservationStore implements DoubleOptInReservationStore {
  items: Map<string, DoubleOptInReservation>;
  order: string[];

  constructor(items: Map<string, DoubleOptInReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DoubleOptInReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DoubleOptInReservation): void {
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

  list(): DoubleOptInReservation[] {
    const out: DoubleOptInReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDoubleOptInReservationStore(): DoubleOptInReservationStore {
  return new MemoryDoubleOptInReservationStore(new Map<string, DoubleOptInReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDoubleOptInReservationStore implements DoubleOptInReservationStore {
  inner: DoubleOptInReservationStore;
  cache: cache.TtlCache<DoubleOptInReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: DoubleOptInReservationStore,
    cacheValue: cache.TtlCache<DoubleOptInReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DoubleOptInReservation | undefined {
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

  save(item: DoubleOptInReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DoubleOptInReservation[] {
    return this.inner.list();
  }
}

export function newCachedDoubleOptInReservationStore(inner: DoubleOptInReservationStore, ttl: number, clockValue: clock.Clock): DoubleOptInReservationStore {
  return new CachedDoubleOptInReservationStore(
    inner,
    cache.newTtlCache<DoubleOptInReservation>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects double opt in reservations. Empty fields match all. */
export class DoubleOptInReservationQuery {
  name: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minWeight: number, statuses: string[], limit: number) {
    this.name = name;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DoubleOptInReservation): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DoubleOptInReservation[]): DoubleOptInReservation[] {
    const matched = collections.filter(items, (candidate: DoubleOptInReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDoubleOptInReservations(store: DoubleOptInReservationStore, query: DoubleOptInReservationQuery): DoubleOptInReservation[] {
  return query.apply(store.list());
}
