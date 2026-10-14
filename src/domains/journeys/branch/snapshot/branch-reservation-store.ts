import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BranchReservation } from "./branch-reservation.js";

/** Keeps branch reservations by code. */
export interface BranchReservationStore {
  find(code: string): BranchReservation | undefined;
  save(item: BranchReservation): void;
  remove(code: string): boolean;
  list(): BranchReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBranchReservationStore implements BranchReservationStore {
  items: Map<string, BranchReservation>;
  order: string[];

  constructor(items: Map<string, BranchReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BranchReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BranchReservation): void {
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

  list(): BranchReservation[] {
    const out: BranchReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBranchReservationStore(): BranchReservationStore {
  return new MemoryBranchReservationStore(new Map<string, BranchReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBranchReservationStore implements BranchReservationStore {
  inner: BranchReservationStore;
  cache: cache.TtlCache<BranchReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: BranchReservationStore,
    cacheValue: cache.TtlCache<BranchReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BranchReservation | undefined {
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

  save(item: BranchReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BranchReservation[] {
    return this.inner.list();
  }
}

export function newCachedBranchReservationStore(inner: BranchReservationStore, ttl: number, clockValue: clock.Clock): BranchReservationStore {
  return new CachedBranchReservationStore(inner, cache.newTtlCache<BranchReservation>(512, ttl, clockValue), 0, 0);
}

/** Selects branch reservations. Empty fields match all. */
export class BranchReservationQuery {
  utmSource: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minEndsAt: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BranchReservation): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BranchReservation[]): BranchReservation[] {
    const matched = collections.filter(items, (candidate: BranchReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBranchReservations(store: BranchReservationStore, query: BranchReservationQuery): BranchReservation[] {
  return query.apply(store.list());
}
