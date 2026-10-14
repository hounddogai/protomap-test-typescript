import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SenderReservation } from "./sender-reservation.js";

/** Keeps sender reservations by code. */
export interface SenderReservationStore {
  find(code: string): SenderReservation | undefined;
  save(item: SenderReservation): void;
  remove(code: string): boolean;
  list(): SenderReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySenderReservationStore implements SenderReservationStore {
  items: Map<string, SenderReservation>;
  order: string[];

  constructor(items: Map<string, SenderReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SenderReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SenderReservation): void {
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

  list(): SenderReservation[] {
    const out: SenderReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySenderReservationStore(): SenderReservationStore {
  return new MemorySenderReservationStore(new Map<string, SenderReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSenderReservationStore implements SenderReservationStore {
  inner: SenderReservationStore;
  cache: cache.TtlCache<SenderReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: SenderReservationStore,
    cacheValue: cache.TtlCache<SenderReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SenderReservation | undefined {
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

  save(item: SenderReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SenderReservation[] {
    return this.inner.list();
  }
}

export function newCachedSenderReservationStore(inner: SenderReservationStore, ttl: number, clockValue: clock.Clock): SenderReservationStore {
  return new CachedSenderReservationStore(inner, cache.newTtlCache<SenderReservation>(128, ttl, clockValue), 0, 0);
}

/** Selects sender reservations. Empty fields match all. */
export class SenderReservationQuery {
  country: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minPriority: number, statuses: string[], limit: number) {
    this.country = country;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SenderReservation): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SenderReservation[]): SenderReservation[] {
    const matched = collections.filter(items, (candidate: SenderReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSenderReservations(store: SenderReservationStore, query: SenderReservationQuery): SenderReservation[] {
  return query.apply(store.list());
}
