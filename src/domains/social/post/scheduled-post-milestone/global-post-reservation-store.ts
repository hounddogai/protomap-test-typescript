import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalPostReservation } from "./global-post-reservation.js";

/** Keeps global post reservations by code. */
export interface GlobalPostReservationStore {
  find(code: string): GlobalPostReservation | undefined;
  save(item: GlobalPostReservation): void;
  remove(code: string): boolean;
  list(): GlobalPostReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalPostReservationStore implements GlobalPostReservationStore {
  items: Map<string, GlobalPostReservation>;
  order: string[];

  constructor(items: Map<string, GlobalPostReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalPostReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalPostReservation): void {
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

  list(): GlobalPostReservation[] {
    const out: GlobalPostReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalPostReservationStore(): GlobalPostReservationStore {
  return new MemoryGlobalPostReservationStore(new Map<string, GlobalPostReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalPostReservationStore implements GlobalPostReservationStore {
  inner: GlobalPostReservationStore;
  cache: cache.TtlCache<GlobalPostReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalPostReservationStore,
    cacheValue: cache.TtlCache<GlobalPostReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalPostReservation | undefined {
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

  save(item: GlobalPostReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalPostReservation[] {
    return this.inner.list();
  }
}

export function newCachedGlobalPostReservationStore(inner: GlobalPostReservationStore, ttl: number, clockValue: clock.Clock): GlobalPostReservationStore {
  return new CachedGlobalPostReservationStore(
    inner,
    cache.newTtlCache<GlobalPostReservation>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects global post reservations. Empty fields match all. */
export class GlobalPostReservationQuery {
  category: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minCeiling: number, statuses: string[], limit: number) {
    this.category = category;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalPostReservation): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalPostReservation[]): GlobalPostReservation[] {
    const matched = collections.filter(items, (candidate: GlobalPostReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalPostReservations(store: GlobalPostReservationStore, query: GlobalPostReservationQuery): GlobalPostReservation[] {
  return query.apply(store.list());
}
