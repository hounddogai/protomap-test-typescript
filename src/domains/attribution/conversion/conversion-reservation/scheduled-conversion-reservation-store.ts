import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledConversionReservation } from "./scheduled-conversion-reservation.js";

/** Keeps scheduled conversion reservations by code. */
export interface ScheduledConversionReservationStore {
  find(code: string): ScheduledConversionReservation | undefined;
  save(item: ScheduledConversionReservation): void;
  remove(code: string): boolean;
  list(): ScheduledConversionReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledConversionReservationStore implements ScheduledConversionReservationStore {
  items: Map<string, ScheduledConversionReservation>;
  order: string[];

  constructor(items: Map<string, ScheduledConversionReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledConversionReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledConversionReservation): void {
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

  list(): ScheduledConversionReservation[] {
    const out: ScheduledConversionReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledConversionReservationStore(): ScheduledConversionReservationStore {
  return new MemoryScheduledConversionReservationStore(new Map<string, ScheduledConversionReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledConversionReservationStore implements ScheduledConversionReservationStore {
  inner: ScheduledConversionReservationStore;
  cache: cache.TtlCache<ScheduledConversionReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledConversionReservationStore,
    cacheValue: cache.TtlCache<ScheduledConversionReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledConversionReservation | undefined {
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

  save(item: ScheduledConversionReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledConversionReservation[] {
    return this.inner.list();
  }
}

export function newCachedScheduledConversionReservationStore(inner: ScheduledConversionReservationStore, ttl: number, clockValue: clock.Clock): ScheduledConversionReservationStore {
  return new CachedScheduledConversionReservationStore(
    inner,
    cache.newTtlCache<ScheduledConversionReservation>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled conversion reservations. Empty fields match all. */
export class ScheduledConversionReservationQuery {
  country: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minCapacity: number, statuses: string[], limit: number) {
    this.country = country;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledConversionReservation): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledConversionReservation[]): ScheduledConversionReservation[] {
    const matched = collections.filter(items, (candidate: ScheduledConversionReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledConversionReservations(store: ScheduledConversionReservationStore, query: ScheduledConversionReservationQuery): ScheduledConversionReservation[] {
  return query.apply(store.list());
}
