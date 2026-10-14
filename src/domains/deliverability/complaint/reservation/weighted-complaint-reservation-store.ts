import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedComplaintReservation } from "./weighted-complaint-reservation.js";

/** Keeps weighted complaint reservations by code. */
export interface WeightedComplaintReservationStore {
  find(code: string): WeightedComplaintReservation | undefined;
  save(item: WeightedComplaintReservation): void;
  remove(code: string): boolean;
  list(): WeightedComplaintReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedComplaintReservationStore implements WeightedComplaintReservationStore {
  items: Map<string, WeightedComplaintReservation>;
  order: string[];

  constructor(items: Map<string, WeightedComplaintReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedComplaintReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedComplaintReservation): void {
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

  list(): WeightedComplaintReservation[] {
    const out: WeightedComplaintReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedComplaintReservationStore(): WeightedComplaintReservationStore {
  return new MemoryWeightedComplaintReservationStore(new Map<string, WeightedComplaintReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedComplaintReservationStore implements WeightedComplaintReservationStore {
  inner: WeightedComplaintReservationStore;
  cache: cache.TtlCache<WeightedComplaintReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedComplaintReservationStore,
    cacheValue: cache.TtlCache<WeightedComplaintReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedComplaintReservation | undefined {
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

  save(item: WeightedComplaintReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedComplaintReservation[] {
    return this.inner.list();
  }
}

export function newCachedWeightedComplaintReservationStore(inner: WeightedComplaintReservationStore, ttl: number, clockValue: clock.Clock): WeightedComplaintReservationStore {
  return new CachedWeightedComplaintReservationStore(
    inner,
    cache.newTtlCache<WeightedComplaintReservation>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted complaint reservations. Empty fields match all. */
export class WeightedComplaintReservationQuery {
  channel: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minCapacity: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedComplaintReservation): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedComplaintReservation[]): WeightedComplaintReservation[] {
    const matched = collections.filter(items, (candidate: WeightedComplaintReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedComplaintReservations(store: WeightedComplaintReservationStore, query: WeightedComplaintReservationQuery): WeightedComplaintReservation[] {
  return query.apply(store.list());
}
