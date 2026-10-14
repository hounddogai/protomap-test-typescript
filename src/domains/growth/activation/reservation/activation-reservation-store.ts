import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ActivationReservation } from "./activation-reservation.js";

/** Keeps activation reservations by code. */
export interface ActivationReservationStore {
  find(code: string): ActivationReservation | undefined;
  save(item: ActivationReservation): void;
  remove(code: string): boolean;
  list(): ActivationReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryActivationReservationStore implements ActivationReservationStore {
  items: Map<string, ActivationReservation>;
  order: string[];

  constructor(items: Map<string, ActivationReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ActivationReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ActivationReservation): void {
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

  list(): ActivationReservation[] {
    const out: ActivationReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryActivationReservationStore(): ActivationReservationStore {
  return new MemoryActivationReservationStore(new Map<string, ActivationReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedActivationReservationStore implements ActivationReservationStore {
  inner: ActivationReservationStore;
  cache: cache.TtlCache<ActivationReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: ActivationReservationStore,
    cacheValue: cache.TtlCache<ActivationReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ActivationReservation | undefined {
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

  save(item: ActivationReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ActivationReservation[] {
    return this.inner.list();
  }
}

export function newCachedActivationReservationStore(inner: ActivationReservationStore, ttl: number, clockValue: clock.Clock): ActivationReservationStore {
  return new CachedActivationReservationStore(
    inner,
    cache.newTtlCache<ActivationReservation>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects activation reservations. Empty fields match all. */
export class ActivationReservationQuery {
  label: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minBid: number, statuses: string[], limit: number) {
    this.label = label;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ActivationReservation): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ActivationReservation[]): ActivationReservation[] {
    const matched = collections.filter(items, (candidate: ActivationReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findActivationReservations(store: ActivationReservationStore, query: ActivationReservationQuery): ActivationReservation[] {
  return query.apply(store.list());
}
