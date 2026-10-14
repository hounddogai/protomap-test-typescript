import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredLevelReservation } from "./tiered-level-reservation.js";

/** Keeps tiered level reservations by code. */
export interface TieredLevelReservationStore {
  find(code: string): TieredLevelReservation | undefined;
  save(item: TieredLevelReservation): void;
  remove(code: string): boolean;
  list(): TieredLevelReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredLevelReservationStore implements TieredLevelReservationStore {
  items: Map<string, TieredLevelReservation>;
  order: string[];

  constructor(items: Map<string, TieredLevelReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredLevelReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredLevelReservation): void {
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

  list(): TieredLevelReservation[] {
    const out: TieredLevelReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredLevelReservationStore(): TieredLevelReservationStore {
  return new MemoryTieredLevelReservationStore(new Map<string, TieredLevelReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredLevelReservationStore implements TieredLevelReservationStore {
  inner: TieredLevelReservationStore;
  cache: cache.TtlCache<TieredLevelReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredLevelReservationStore,
    cacheValue: cache.TtlCache<TieredLevelReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredLevelReservation | undefined {
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

  save(item: TieredLevelReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredLevelReservation[] {
    return this.inner.list();
  }
}

export function newCachedTieredLevelReservationStore(inner: TieredLevelReservationStore, ttl: number, clockValue: clock.Clock): TieredLevelReservationStore {
  return new CachedTieredLevelReservationStore(
    inner,
    cache.newTtlCache<TieredLevelReservation>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered level reservations. Empty fields match all. */
export class TieredLevelReservationQuery {
  category: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.category = category;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredLevelReservation): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredLevelReservation[]): TieredLevelReservation[] {
    const matched = collections.filter(items, (candidate: TieredLevelReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredLevelReservations(store: TieredLevelReservationStore, query: TieredLevelReservationQuery): TieredLevelReservation[] {
  return query.apply(store.list());
}
