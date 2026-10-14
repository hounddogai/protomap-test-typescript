import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyFlightReservation } from "./legacy-flight-reservation.js";

/** Keeps legacy flight reservations by code. */
export interface LegacyFlightReservationStore {
  find(code: string): LegacyFlightReservation | undefined;
  save(item: LegacyFlightReservation): void;
  remove(code: string): boolean;
  list(): LegacyFlightReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyFlightReservationStore implements LegacyFlightReservationStore {
  items: Map<string, LegacyFlightReservation>;
  order: string[];

  constructor(items: Map<string, LegacyFlightReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyFlightReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyFlightReservation): void {
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

  list(): LegacyFlightReservation[] {
    const out: LegacyFlightReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyFlightReservationStore(): LegacyFlightReservationStore {
  return new MemoryLegacyFlightReservationStore(new Map<string, LegacyFlightReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyFlightReservationStore implements LegacyFlightReservationStore {
  inner: LegacyFlightReservationStore;
  cache: cache.TtlCache<LegacyFlightReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyFlightReservationStore,
    cacheValue: cache.TtlCache<LegacyFlightReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyFlightReservation | undefined {
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

  save(item: LegacyFlightReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyFlightReservation[] {
    return this.inner.list();
  }
}

export function newCachedLegacyFlightReservationStore(inner: LegacyFlightReservationStore, ttl: number, clockValue: clock.Clock): LegacyFlightReservationStore {
  return new CachedLegacyFlightReservationStore(
    inner,
    cache.newTtlCache<LegacyFlightReservation>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy flight reservations. Empty fields match all. */
export class LegacyFlightReservationQuery {
  unit: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minPriority: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyFlightReservation): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyFlightReservation[]): LegacyFlightReservation[] {
    const matched = collections.filter(items, (candidate: LegacyFlightReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyFlightReservations(store: LegacyFlightReservationStore, query: LegacyFlightReservationQuery): LegacyFlightReservation[] {
  return query.apply(store.list());
}
