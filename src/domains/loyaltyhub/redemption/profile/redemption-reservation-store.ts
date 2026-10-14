import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RedemptionReservation } from "./redemption-reservation.js";

/** Keeps redemption reservations by code. */
export interface RedemptionReservationStore {
  find(code: string): RedemptionReservation | undefined;
  save(item: RedemptionReservation): void;
  remove(code: string): boolean;
  list(): RedemptionReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRedemptionReservationStore implements RedemptionReservationStore {
  items: Map<string, RedemptionReservation>;
  order: string[];

  constructor(items: Map<string, RedemptionReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RedemptionReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RedemptionReservation): void {
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

  list(): RedemptionReservation[] {
    const out: RedemptionReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRedemptionReservationStore(): RedemptionReservationStore {
  return new MemoryRedemptionReservationStore(new Map<string, RedemptionReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRedemptionReservationStore implements RedemptionReservationStore {
  inner: RedemptionReservationStore;
  cache: cache.TtlCache<RedemptionReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: RedemptionReservationStore,
    cacheValue: cache.TtlCache<RedemptionReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RedemptionReservation | undefined {
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

  save(item: RedemptionReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RedemptionReservation[] {
    return this.inner.list();
  }
}

export function newCachedRedemptionReservationStore(inner: RedemptionReservationStore, ttl: number, clockValue: clock.Clock): RedemptionReservationStore {
  return new CachedRedemptionReservationStore(
    inner,
    cache.newTtlCache<RedemptionReservation>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects redemption reservations. Empty fields match all. */
export class RedemptionReservationQuery {
  utmSource: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minAttempts: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RedemptionReservation): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RedemptionReservation[]): RedemptionReservation[] {
    const matched = collections.filter(items, (candidate: RedemptionReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRedemptionReservations(store: RedemptionReservationStore, query: RedemptionReservationQuery): RedemptionReservation[] {
  return query.apply(store.list());
}
