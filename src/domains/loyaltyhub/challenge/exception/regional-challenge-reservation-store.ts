import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalChallengeReservation } from "./regional-challenge-reservation.js";

/** Keeps regional challenge reservations by code. */
export interface RegionalChallengeReservationStore {
  find(code: string): RegionalChallengeReservation | undefined;
  save(item: RegionalChallengeReservation): void;
  remove(code: string): boolean;
  list(): RegionalChallengeReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalChallengeReservationStore implements RegionalChallengeReservationStore {
  items: Map<string, RegionalChallengeReservation>;
  order: string[];

  constructor(items: Map<string, RegionalChallengeReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalChallengeReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalChallengeReservation): void {
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

  list(): RegionalChallengeReservation[] {
    const out: RegionalChallengeReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalChallengeReservationStore(): RegionalChallengeReservationStore {
  return new MemoryRegionalChallengeReservationStore(new Map<string, RegionalChallengeReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalChallengeReservationStore implements RegionalChallengeReservationStore {
  inner: RegionalChallengeReservationStore;
  cache: cache.TtlCache<RegionalChallengeReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalChallengeReservationStore,
    cacheValue: cache.TtlCache<RegionalChallengeReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalChallengeReservation | undefined {
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

  save(item: RegionalChallengeReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalChallengeReservation[] {
    return this.inner.list();
  }
}

export function newCachedRegionalChallengeReservationStore(inner: RegionalChallengeReservationStore, ttl: number, clockValue: clock.Clock): RegionalChallengeReservationStore {
  return new CachedRegionalChallengeReservationStore(
    inner,
    cache.newTtlCache<RegionalChallengeReservation>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional challenge reservations. Empty fields match all. */
export class RegionalChallengeReservationQuery {
  title: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minQuantity: number, statuses: string[], limit: number) {
    this.title = title;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalChallengeReservation): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalChallengeReservation[]): RegionalChallengeReservation[] {
    const matched = collections.filter(items, (candidate: RegionalChallengeReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalChallengeReservations(store: RegionalChallengeReservationStore, query: RegionalChallengeReservationQuery): RegionalChallengeReservation[] {
  return query.apply(store.list());
}
