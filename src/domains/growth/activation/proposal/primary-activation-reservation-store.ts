import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryActivationReservation } from "./primary-activation-reservation.js";

/** Keeps primary activation reservations by code. */
export interface PrimaryActivationReservationStore {
  find(code: string): PrimaryActivationReservation | undefined;
  save(item: PrimaryActivationReservation): void;
  remove(code: string): boolean;
  list(): PrimaryActivationReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryActivationReservationStore implements PrimaryActivationReservationStore {
  items: Map<string, PrimaryActivationReservation>;
  order: string[];

  constructor(items: Map<string, PrimaryActivationReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryActivationReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryActivationReservation): void {
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

  list(): PrimaryActivationReservation[] {
    const out: PrimaryActivationReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryActivationReservationStore(): PrimaryActivationReservationStore {
  return new MemoryPrimaryActivationReservationStore(new Map<string, PrimaryActivationReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryActivationReservationStore implements PrimaryActivationReservationStore {
  inner: PrimaryActivationReservationStore;
  cache: cache.TtlCache<PrimaryActivationReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryActivationReservationStore,
    cacheValue: cache.TtlCache<PrimaryActivationReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryActivationReservation | undefined {
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

  save(item: PrimaryActivationReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryActivationReservation[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryActivationReservationStore(inner: PrimaryActivationReservationStore, ttl: number, clockValue: clock.Clock): PrimaryActivationReservationStore {
  return new CachedPrimaryActivationReservationStore(
    inner,
    cache.newTtlCache<PrimaryActivationReservation>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary activation reservations. Empty fields match all. */
export class PrimaryActivationReservationQuery {
  source: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minCost: number, statuses: string[], limit: number) {
    this.source = source;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryActivationReservation): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryActivationReservation[]): PrimaryActivationReservation[] {
    const matched = collections.filter(items, (candidate: PrimaryActivationReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryActivationReservations(store: PrimaryActivationReservationStore, query: PrimaryActivationReservationQuery): PrimaryActivationReservation[] {
  return query.apply(store.list());
}
