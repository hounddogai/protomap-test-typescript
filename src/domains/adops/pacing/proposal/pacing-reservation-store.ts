import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PacingReservation } from "./pacing-reservation.js";

/** Keeps pacing reservations by code. */
export interface PacingReservationStore {
  find(code: string): PacingReservation | undefined;
  save(item: PacingReservation): void;
  remove(code: string): boolean;
  list(): PacingReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPacingReservationStore implements PacingReservationStore {
  items: Map<string, PacingReservation>;
  order: string[];

  constructor(items: Map<string, PacingReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PacingReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PacingReservation): void {
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

  list(): PacingReservation[] {
    const out: PacingReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPacingReservationStore(): PacingReservationStore {
  return new MemoryPacingReservationStore(new Map<string, PacingReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPacingReservationStore implements PacingReservationStore {
  inner: PacingReservationStore;
  cache: cache.TtlCache<PacingReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: PacingReservationStore,
    cacheValue: cache.TtlCache<PacingReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PacingReservation | undefined {
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

  save(item: PacingReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PacingReservation[] {
    return this.inner.list();
  }
}

export function newCachedPacingReservationStore(inner: PacingReservationStore, ttl: number, clockValue: clock.Clock): PacingReservationStore {
  return new CachedPacingReservationStore(inner, cache.newTtlCache<PacingReservation>(512, ttl, clockValue), 0, 0);
}

/** Selects pacing reservations. Empty fields match all. */
export class PacingReservationQuery {
  region: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minRetries: number, statuses: string[], limit: number) {
    this.region = region;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PacingReservation): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PacingReservation[]): PacingReservation[] {
    const matched = collections.filter(items, (candidate: PacingReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPacingReservations(store: PacingReservationStore, query: PacingReservationQuery): PacingReservation[] {
  return query.apply(store.list());
}
