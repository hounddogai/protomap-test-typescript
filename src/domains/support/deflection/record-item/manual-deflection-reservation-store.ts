import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualDeflectionReservation } from "./manual-deflection-reservation.js";

/** Keeps manual deflection reservations by code. */
export interface ManualDeflectionReservationStore {
  find(code: string): ManualDeflectionReservation | undefined;
  save(item: ManualDeflectionReservation): void;
  remove(code: string): boolean;
  list(): ManualDeflectionReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualDeflectionReservationStore implements ManualDeflectionReservationStore {
  items: Map<string, ManualDeflectionReservation>;
  order: string[];

  constructor(items: Map<string, ManualDeflectionReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualDeflectionReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualDeflectionReservation): void {
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

  list(): ManualDeflectionReservation[] {
    const out: ManualDeflectionReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualDeflectionReservationStore(): ManualDeflectionReservationStore {
  return new MemoryManualDeflectionReservationStore(new Map<string, ManualDeflectionReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualDeflectionReservationStore implements ManualDeflectionReservationStore {
  inner: ManualDeflectionReservationStore;
  cache: cache.TtlCache<ManualDeflectionReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualDeflectionReservationStore,
    cacheValue: cache.TtlCache<ManualDeflectionReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualDeflectionReservation | undefined {
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

  save(item: ManualDeflectionReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualDeflectionReservation[] {
    return this.inner.list();
  }
}

export function newCachedManualDeflectionReservationStore(inner: ManualDeflectionReservationStore, ttl: number, clockValue: clock.Clock): ManualDeflectionReservationStore {
  return new CachedManualDeflectionReservationStore(
    inner,
    cache.newTtlCache<ManualDeflectionReservation>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects manual deflection reservations. Empty fields match all. */
export class ManualDeflectionReservationQuery {
  title: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minMinimum: number, statuses: string[], limit: number) {
    this.title = title;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualDeflectionReservation): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualDeflectionReservation[]): ManualDeflectionReservation[] {
    const matched = collections.filter(items, (candidate: ManualDeflectionReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualDeflectionReservations(store: ManualDeflectionReservationStore, query: ManualDeflectionReservationQuery): ManualDeflectionReservation[] {
  return query.apply(store.list());
}
