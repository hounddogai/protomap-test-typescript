import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackPaywallReservation } from "./fallback-paywall-reservation.js";

/** Keeps fallback paywall reservations by code. */
export interface FallbackPaywallReservationStore {
  find(code: string): FallbackPaywallReservation | undefined;
  save(item: FallbackPaywallReservation): void;
  remove(code: string): boolean;
  list(): FallbackPaywallReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackPaywallReservationStore implements FallbackPaywallReservationStore {
  items: Map<string, FallbackPaywallReservation>;
  order: string[];

  constructor(items: Map<string, FallbackPaywallReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackPaywallReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackPaywallReservation): void {
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

  list(): FallbackPaywallReservation[] {
    const out: FallbackPaywallReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackPaywallReservationStore(): FallbackPaywallReservationStore {
  return new MemoryFallbackPaywallReservationStore(new Map<string, FallbackPaywallReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackPaywallReservationStore implements FallbackPaywallReservationStore {
  inner: FallbackPaywallReservationStore;
  cache: cache.TtlCache<FallbackPaywallReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackPaywallReservationStore,
    cacheValue: cache.TtlCache<FallbackPaywallReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackPaywallReservation | undefined {
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

  save(item: FallbackPaywallReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackPaywallReservation[] {
    return this.inner.list();
  }
}

export function newCachedFallbackPaywallReservationStore(inner: FallbackPaywallReservationStore, ttl: number, clockValue: clock.Clock): FallbackPaywallReservationStore {
  return new CachedFallbackPaywallReservationStore(
    inner,
    cache.newTtlCache<FallbackPaywallReservation>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback paywall reservations. Empty fields match all. */
export class FallbackPaywallReservationQuery {
  channel: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minBudget: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackPaywallReservation): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackPaywallReservation[]): FallbackPaywallReservation[] {
    const matched = collections.filter(items, (candidate: FallbackPaywallReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackPaywallReservations(store: FallbackPaywallReservationStore, query: FallbackPaywallReservationQuery): FallbackPaywallReservation[] {
  return query.apply(store.list());
}
