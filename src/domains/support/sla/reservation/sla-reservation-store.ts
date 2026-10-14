import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SlaReservation } from "./sla-reservation.js";

/** Keeps sla reservations by code. */
export interface SlaReservationStore {
  find(code: string): SlaReservation | undefined;
  save(item: SlaReservation): void;
  remove(code: string): boolean;
  list(): SlaReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySlaReservationStore implements SlaReservationStore {
  items: Map<string, SlaReservation>;
  order: string[];

  constructor(items: Map<string, SlaReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SlaReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SlaReservation): void {
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

  list(): SlaReservation[] {
    const out: SlaReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySlaReservationStore(): SlaReservationStore {
  return new MemorySlaReservationStore(new Map<string, SlaReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSlaReservationStore implements SlaReservationStore {
  inner: SlaReservationStore;
  cache: cache.TtlCache<SlaReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: SlaReservationStore,
    cacheValue: cache.TtlCache<SlaReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SlaReservation | undefined {
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

  save(item: SlaReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SlaReservation[] {
    return this.inner.list();
  }
}

export function newCachedSlaReservationStore(inner: SlaReservationStore, ttl: number, clockValue: clock.Clock): SlaReservationStore {
  return new CachedSlaReservationStore(inner, cache.newTtlCache<SlaReservation>(128, ttl, clockValue), 0, 0);
}

/** Selects sla reservations. Empty fields match all. */
export class SlaReservationQuery {
  locale: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minGraceDays: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SlaReservation): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SlaReservation[]): SlaReservation[] {
    const matched = collections.filter(items, (candidate: SlaReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSlaReservations(store: SlaReservationStore, query: SlaReservationQuery): SlaReservation[] {
  return query.apply(store.list());
}
