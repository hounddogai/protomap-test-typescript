import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { QueueReservation } from "./queue-reservation.js";

/** Keeps queue reservations by code. */
export interface QueueReservationStore {
  find(code: string): QueueReservation | undefined;
  save(item: QueueReservation): void;
  remove(code: string): boolean;
  list(): QueueReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryQueueReservationStore implements QueueReservationStore {
  items: Map<string, QueueReservation>;
  order: string[];

  constructor(items: Map<string, QueueReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): QueueReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: QueueReservation): void {
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

  list(): QueueReservation[] {
    const out: QueueReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryQueueReservationStore(): QueueReservationStore {
  return new MemoryQueueReservationStore(new Map<string, QueueReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedQueueReservationStore implements QueueReservationStore {
  inner: QueueReservationStore;
  cache: cache.TtlCache<QueueReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: QueueReservationStore,
    cacheValue: cache.TtlCache<QueueReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): QueueReservation | undefined {
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

  save(item: QueueReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): QueueReservation[] {
    return this.inner.list();
  }
}

export function newCachedQueueReservationStore(inner: QueueReservationStore, ttl: number, clockValue: clock.Clock): QueueReservationStore {
  return new CachedQueueReservationStore(inner, cache.newTtlCache<QueueReservation>(1024, ttl, clockValue), 0, 0);
}

/** Selects queue reservations. Empty fields match all. */
export class QueueReservationQuery {
  locale: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minBudget: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: QueueReservation): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: QueueReservation[]): QueueReservation[] {
    const matched = collections.filter(items, (candidate: QueueReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findQueueReservations(store: QueueReservationStore, query: QueueReservationQuery): QueueReservation[] {
  return query.apply(store.list());
}
