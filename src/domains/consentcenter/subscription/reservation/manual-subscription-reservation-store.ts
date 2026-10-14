import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualSubscriptionReservation } from "./manual-subscription-reservation.js";

/** Keeps manual subscription reservations by code. */
export interface ManualSubscriptionReservationStore {
  find(code: string): ManualSubscriptionReservation | undefined;
  save(item: ManualSubscriptionReservation): void;
  remove(code: string): boolean;
  list(): ManualSubscriptionReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualSubscriptionReservationStore implements ManualSubscriptionReservationStore {
  items: Map<string, ManualSubscriptionReservation>;
  order: string[];

  constructor(items: Map<string, ManualSubscriptionReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualSubscriptionReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualSubscriptionReservation): void {
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

  list(): ManualSubscriptionReservation[] {
    const out: ManualSubscriptionReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualSubscriptionReservationStore(): ManualSubscriptionReservationStore {
  return new MemoryManualSubscriptionReservationStore(new Map<string, ManualSubscriptionReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualSubscriptionReservationStore implements ManualSubscriptionReservationStore {
  inner: ManualSubscriptionReservationStore;
  cache: cache.TtlCache<ManualSubscriptionReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualSubscriptionReservationStore,
    cacheValue: cache.TtlCache<ManualSubscriptionReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualSubscriptionReservation | undefined {
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

  save(item: ManualSubscriptionReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualSubscriptionReservation[] {
    return this.inner.list();
  }
}

export function newCachedManualSubscriptionReservationStore(inner: ManualSubscriptionReservationStore, ttl: number, clockValue: clock.Clock): ManualSubscriptionReservationStore {
  return new CachedManualSubscriptionReservationStore(
    inner,
    cache.newTtlCache<ManualSubscriptionReservation>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects manual subscription reservations. Empty fields match all. */
export class ManualSubscriptionReservationQuery {
  title: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minRate: number, statuses: string[], limit: number) {
    this.title = title;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualSubscriptionReservation): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualSubscriptionReservation[]): ManualSubscriptionReservation[] {
    const matched = collections.filter(items, (candidate: ManualSubscriptionReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualSubscriptionReservations(store: ManualSubscriptionReservationStore, query: ManualSubscriptionReservationQuery): ManualSubscriptionReservation[] {
  return query.apply(store.list());
}
