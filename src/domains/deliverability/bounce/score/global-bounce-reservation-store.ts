import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalBounceReservation } from "./global-bounce-reservation.js";

/** Keeps global bounce reservations by code. */
export interface GlobalBounceReservationStore {
  find(code: string): GlobalBounceReservation | undefined;
  save(item: GlobalBounceReservation): void;
  remove(code: string): boolean;
  list(): GlobalBounceReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalBounceReservationStore implements GlobalBounceReservationStore {
  items: Map<string, GlobalBounceReservation>;
  order: string[];

  constructor(items: Map<string, GlobalBounceReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalBounceReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalBounceReservation): void {
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

  list(): GlobalBounceReservation[] {
    const out: GlobalBounceReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalBounceReservationStore(): GlobalBounceReservationStore {
  return new MemoryGlobalBounceReservationStore(new Map<string, GlobalBounceReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalBounceReservationStore implements GlobalBounceReservationStore {
  inner: GlobalBounceReservationStore;
  cache: cache.TtlCache<GlobalBounceReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalBounceReservationStore,
    cacheValue: cache.TtlCache<GlobalBounceReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalBounceReservation | undefined {
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

  save(item: GlobalBounceReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalBounceReservation[] {
    return this.inner.list();
  }
}

export function newCachedGlobalBounceReservationStore(inner: GlobalBounceReservationStore, ttl: number, clockValue: clock.Clock): GlobalBounceReservationStore {
  return new CachedGlobalBounceReservationStore(
    inner,
    cache.newTtlCache<GlobalBounceReservation>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects global bounce reservations. Empty fields match all. */
export class GlobalBounceReservationQuery {
  label: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minFloorValue: number, statuses: string[], limit: number) {
    this.label = label;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalBounceReservation): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalBounceReservation[]): GlobalBounceReservation[] {
    const matched = collections.filter(items, (candidate: GlobalBounceReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalBounceReservations(store: GlobalBounceReservationStore, query: GlobalBounceReservationQuery): GlobalBounceReservation[] {
  return query.apply(store.list());
}
