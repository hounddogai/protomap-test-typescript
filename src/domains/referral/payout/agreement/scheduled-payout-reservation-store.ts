import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledPayoutReservation } from "./scheduled-payout-reservation.js";

/** Keeps scheduled payout reservations by code. */
export interface ScheduledPayoutReservationStore {
  find(code: string): ScheduledPayoutReservation | undefined;
  save(item: ScheduledPayoutReservation): void;
  remove(code: string): boolean;
  list(): ScheduledPayoutReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledPayoutReservationStore implements ScheduledPayoutReservationStore {
  items: Map<string, ScheduledPayoutReservation>;
  order: string[];

  constructor(items: Map<string, ScheduledPayoutReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledPayoutReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledPayoutReservation): void {
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

  list(): ScheduledPayoutReservation[] {
    const out: ScheduledPayoutReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledPayoutReservationStore(): ScheduledPayoutReservationStore {
  return new MemoryScheduledPayoutReservationStore(new Map<string, ScheduledPayoutReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledPayoutReservationStore implements ScheduledPayoutReservationStore {
  inner: ScheduledPayoutReservationStore;
  cache: cache.TtlCache<ScheduledPayoutReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledPayoutReservationStore,
    cacheValue: cache.TtlCache<ScheduledPayoutReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledPayoutReservation | undefined {
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

  save(item: ScheduledPayoutReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledPayoutReservation[] {
    return this.inner.list();
  }
}

export function newCachedScheduledPayoutReservationStore(inner: ScheduledPayoutReservationStore, ttl: number, clockValue: clock.Clock): ScheduledPayoutReservationStore {
  return new CachedScheduledPayoutReservationStore(
    inner,
    cache.newTtlCache<ScheduledPayoutReservation>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled payout reservations. Empty fields match all. */
export class ScheduledPayoutReservationQuery {
  channel: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minScore: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledPayoutReservation): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledPayoutReservation[]): ScheduledPayoutReservation[] {
    const matched = collections.filter(items, (candidate: ScheduledPayoutReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledPayoutReservations(store: ScheduledPayoutReservationStore, query: ScheduledPayoutReservationQuery): ScheduledPayoutReservation[] {
  return query.apply(store.list());
}
