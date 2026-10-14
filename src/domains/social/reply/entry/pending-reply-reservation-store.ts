import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingReplyReservation } from "./pending-reply-reservation.js";

/** Keeps pending reply reservations by code. */
export interface PendingReplyReservationStore {
  find(code: string): PendingReplyReservation | undefined;
  save(item: PendingReplyReservation): void;
  remove(code: string): boolean;
  list(): PendingReplyReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingReplyReservationStore implements PendingReplyReservationStore {
  items: Map<string, PendingReplyReservation>;
  order: string[];

  constructor(items: Map<string, PendingReplyReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingReplyReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingReplyReservation): void {
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

  list(): PendingReplyReservation[] {
    const out: PendingReplyReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingReplyReservationStore(): PendingReplyReservationStore {
  return new MemoryPendingReplyReservationStore(new Map<string, PendingReplyReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingReplyReservationStore implements PendingReplyReservationStore {
  inner: PendingReplyReservationStore;
  cache: cache.TtlCache<PendingReplyReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingReplyReservationStore,
    cacheValue: cache.TtlCache<PendingReplyReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingReplyReservation | undefined {
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

  save(item: PendingReplyReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingReplyReservation[] {
    return this.inner.list();
  }
}

export function newCachedPendingReplyReservationStore(inner: PendingReplyReservationStore, ttl: number, clockValue: clock.Clock): PendingReplyReservationStore {
  return new CachedPendingReplyReservationStore(
    inner,
    cache.newTtlCache<PendingReplyReservation>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending reply reservations. Empty fields match all. */
export class PendingReplyReservationQuery {
  name: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minWeight: number, statuses: string[], limit: number) {
    this.name = name;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingReplyReservation): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingReplyReservation[]): PendingReplyReservation[] {
    const matched = collections.filter(items, (candidate: PendingReplyReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingReplyReservations(store: PendingReplyReservationStore, query: PendingReplyReservationQuery): PendingReplyReservation[] {
  return query.apply(store.list());
}
