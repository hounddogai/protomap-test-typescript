import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalSubscriptionReservation } from "./regional-subscription-reservation.js";

/** Keeps regional subscription reservations by code. */
export interface RegionalSubscriptionReservationStore {
  find(code: string): RegionalSubscriptionReservation | undefined;
  save(item: RegionalSubscriptionReservation): void;
  remove(code: string): boolean;
  list(): RegionalSubscriptionReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalSubscriptionReservationStore implements RegionalSubscriptionReservationStore {
  items: Map<string, RegionalSubscriptionReservation>;
  order: string[];

  constructor(items: Map<string, RegionalSubscriptionReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalSubscriptionReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalSubscriptionReservation): void {
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

  list(): RegionalSubscriptionReservation[] {
    const out: RegionalSubscriptionReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalSubscriptionReservationStore(): RegionalSubscriptionReservationStore {
  return new MemoryRegionalSubscriptionReservationStore(new Map<string, RegionalSubscriptionReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalSubscriptionReservationStore implements RegionalSubscriptionReservationStore {
  inner: RegionalSubscriptionReservationStore;
  cache: cache.TtlCache<RegionalSubscriptionReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalSubscriptionReservationStore,
    cacheValue: cache.TtlCache<RegionalSubscriptionReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalSubscriptionReservation | undefined {
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

  save(item: RegionalSubscriptionReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalSubscriptionReservation[] {
    return this.inner.list();
  }
}

export function newCachedRegionalSubscriptionReservationStore(inner: RegionalSubscriptionReservationStore, ttl: number, clockValue: clock.Clock): RegionalSubscriptionReservationStore {
  return new CachedRegionalSubscriptionReservationStore(
    inner,
    cache.newTtlCache<RegionalSubscriptionReservation>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional subscription reservations. Empty fields match all. */
export class RegionalSubscriptionReservationQuery {
  title: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minOpenRate: number, statuses: string[], limit: number) {
    this.title = title;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalSubscriptionReservation): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalSubscriptionReservation[]): RegionalSubscriptionReservation[] {
    const matched = collections.filter(items, (candidate: RegionalSubscriptionReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalSubscriptionReservations(store: RegionalSubscriptionReservationStore, query: RegionalSubscriptionReservationQuery): RegionalSubscriptionReservation[] {
  return query.apply(store.list());
}
