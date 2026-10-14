import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackSenderReservation } from "./fallback-sender-reservation.js";

/** Keeps fallback sender reservations by code. */
export interface FallbackSenderReservationStore {
  find(code: string): FallbackSenderReservation | undefined;
  save(item: FallbackSenderReservation): void;
  remove(code: string): boolean;
  list(): FallbackSenderReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackSenderReservationStore implements FallbackSenderReservationStore {
  items: Map<string, FallbackSenderReservation>;
  order: string[];

  constructor(items: Map<string, FallbackSenderReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackSenderReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackSenderReservation): void {
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

  list(): FallbackSenderReservation[] {
    const out: FallbackSenderReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackSenderReservationStore(): FallbackSenderReservationStore {
  return new MemoryFallbackSenderReservationStore(new Map<string, FallbackSenderReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackSenderReservationStore implements FallbackSenderReservationStore {
  inner: FallbackSenderReservationStore;
  cache: cache.TtlCache<FallbackSenderReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackSenderReservationStore,
    cacheValue: cache.TtlCache<FallbackSenderReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackSenderReservation | undefined {
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

  save(item: FallbackSenderReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackSenderReservation[] {
    return this.inner.list();
  }
}

export function newCachedFallbackSenderReservationStore(inner: FallbackSenderReservationStore, ttl: number, clockValue: clock.Clock): FallbackSenderReservationStore {
  return new CachedFallbackSenderReservationStore(
    inner,
    cache.newTtlCache<FallbackSenderReservation>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback sender reservations. Empty fields match all. */
export class FallbackSenderReservationQuery {
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

  matches(item: FallbackSenderReservation): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackSenderReservation[]): FallbackSenderReservation[] {
    const matched = collections.filter(items, (candidate: FallbackSenderReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackSenderReservations(store: FallbackSenderReservationStore, query: FallbackSenderReservationQuery): FallbackSenderReservation[] {
  return query.apply(store.list());
}
