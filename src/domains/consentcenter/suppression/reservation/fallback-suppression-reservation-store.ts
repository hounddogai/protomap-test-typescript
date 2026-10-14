import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackSuppressionReservation } from "./fallback-suppression-reservation.js";

/** Keeps fallback suppression reservations by code. */
export interface FallbackSuppressionReservationStore {
  find(code: string): FallbackSuppressionReservation | undefined;
  save(item: FallbackSuppressionReservation): void;
  remove(code: string): boolean;
  list(): FallbackSuppressionReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackSuppressionReservationStore implements FallbackSuppressionReservationStore {
  items: Map<string, FallbackSuppressionReservation>;
  order: string[];

  constructor(items: Map<string, FallbackSuppressionReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackSuppressionReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackSuppressionReservation): void {
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

  list(): FallbackSuppressionReservation[] {
    const out: FallbackSuppressionReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackSuppressionReservationStore(): FallbackSuppressionReservationStore {
  return new MemoryFallbackSuppressionReservationStore(new Map<string, FallbackSuppressionReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackSuppressionReservationStore implements FallbackSuppressionReservationStore {
  inner: FallbackSuppressionReservationStore;
  cache: cache.TtlCache<FallbackSuppressionReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackSuppressionReservationStore,
    cacheValue: cache.TtlCache<FallbackSuppressionReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackSuppressionReservation | undefined {
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

  save(item: FallbackSuppressionReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackSuppressionReservation[] {
    return this.inner.list();
  }
}

export function newCachedFallbackSuppressionReservationStore(inner: FallbackSuppressionReservationStore, ttl: number, clockValue: clock.Clock): FallbackSuppressionReservationStore {
  return new CachedFallbackSuppressionReservationStore(
    inner,
    cache.newTtlCache<FallbackSuppressionReservation>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback suppression reservations. Empty fields match all. */
export class FallbackSuppressionReservationQuery {
  unit: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackSuppressionReservation): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackSuppressionReservation[]): FallbackSuppressionReservation[] {
    const matched = collections.filter(items, (candidate: FallbackSuppressionReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackSuppressionReservations(store: FallbackSuppressionReservationStore, query: FallbackSuppressionReservationQuery): FallbackSuppressionReservation[] {
  return query.apply(store.list());
}
