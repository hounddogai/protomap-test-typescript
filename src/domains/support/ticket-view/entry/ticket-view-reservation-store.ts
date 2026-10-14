import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TicketViewReservation } from "./ticket-view-reservation.js";

/** Keeps ticket view reservations by code. */
export interface TicketViewReservationStore {
  find(code: string): TicketViewReservation | undefined;
  save(item: TicketViewReservation): void;
  remove(code: string): boolean;
  list(): TicketViewReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTicketViewReservationStore implements TicketViewReservationStore {
  items: Map<string, TicketViewReservation>;
  order: string[];

  constructor(items: Map<string, TicketViewReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TicketViewReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TicketViewReservation): void {
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

  list(): TicketViewReservation[] {
    const out: TicketViewReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTicketViewReservationStore(): TicketViewReservationStore {
  return new MemoryTicketViewReservationStore(new Map<string, TicketViewReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTicketViewReservationStore implements TicketViewReservationStore {
  inner: TicketViewReservationStore;
  cache: cache.TtlCache<TicketViewReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: TicketViewReservationStore,
    cacheValue: cache.TtlCache<TicketViewReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TicketViewReservation | undefined {
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

  save(item: TicketViewReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TicketViewReservation[] {
    return this.inner.list();
  }
}

export function newCachedTicketViewReservationStore(inner: TicketViewReservationStore, ttl: number, clockValue: clock.Clock): TicketViewReservationStore {
  return new CachedTicketViewReservationStore(
    inner,
    cache.newTtlCache<TicketViewReservation>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects ticket view reservations. Empty fields match all. */
export class TicketViewReservationQuery {
  channel: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minBatchSize: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TicketViewReservation): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TicketViewReservation[]): TicketViewReservation[] {
    const matched = collections.filter(items, (candidate: TicketViewReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTicketViewReservations(store: TicketViewReservationStore, query: TicketViewReservationQuery): TicketViewReservation[] {
  return query.apply(store.list());
}
