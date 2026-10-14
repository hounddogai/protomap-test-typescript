import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultRedemptionReservation } from "./default-redemption-reservation.js";

/** Keeps default redemption reservations by code. */
export interface DefaultRedemptionReservationStore {
  find(code: string): DefaultRedemptionReservation | undefined;
  save(item: DefaultRedemptionReservation): void;
  remove(code: string): boolean;
  list(): DefaultRedemptionReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultRedemptionReservationStore implements DefaultRedemptionReservationStore {
  items: Map<string, DefaultRedemptionReservation>;
  order: string[];

  constructor(items: Map<string, DefaultRedemptionReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultRedemptionReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultRedemptionReservation): void {
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

  list(): DefaultRedemptionReservation[] {
    const out: DefaultRedemptionReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultRedemptionReservationStore(): DefaultRedemptionReservationStore {
  return new MemoryDefaultRedemptionReservationStore(new Map<string, DefaultRedemptionReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultRedemptionReservationStore implements DefaultRedemptionReservationStore {
  inner: DefaultRedemptionReservationStore;
  cache: cache.TtlCache<DefaultRedemptionReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultRedemptionReservationStore,
    cacheValue: cache.TtlCache<DefaultRedemptionReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultRedemptionReservation | undefined {
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

  save(item: DefaultRedemptionReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultRedemptionReservation[] {
    return this.inner.list();
  }
}

export function newCachedDefaultRedemptionReservationStore(inner: DefaultRedemptionReservationStore, ttl: number, clockValue: clock.Clock): DefaultRedemptionReservationStore {
  return new CachedDefaultRedemptionReservationStore(
    inner,
    cache.newTtlCache<DefaultRedemptionReservation>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default redemption reservations. Empty fields match all. */
export class DefaultRedemptionReservationQuery {
  label: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minDiscount: number, statuses: string[], limit: number) {
    this.label = label;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultRedemptionReservation): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultRedemptionReservation[]): DefaultRedemptionReservation[] {
    const matched = collections.filter(items, (candidate: DefaultRedemptionReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultRedemptionReservations(store: DefaultRedemptionReservationStore, query: DefaultRedemptionReservationQuery): DefaultRedemptionReservation[] {
  return query.apply(store.list());
}
