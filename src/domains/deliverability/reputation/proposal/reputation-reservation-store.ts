import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ReputationReservation } from "./reputation-reservation.js";

/** Keeps reputation reservations by code. */
export interface ReputationReservationStore {
  find(code: string): ReputationReservation | undefined;
  save(item: ReputationReservation): void;
  remove(code: string): boolean;
  list(): ReputationReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryReputationReservationStore implements ReputationReservationStore {
  items: Map<string, ReputationReservation>;
  order: string[];

  constructor(items: Map<string, ReputationReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ReputationReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ReputationReservation): void {
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

  list(): ReputationReservation[] {
    const out: ReputationReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryReputationReservationStore(): ReputationReservationStore {
  return new MemoryReputationReservationStore(new Map<string, ReputationReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedReputationReservationStore implements ReputationReservationStore {
  inner: ReputationReservationStore;
  cache: cache.TtlCache<ReputationReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: ReputationReservationStore,
    cacheValue: cache.TtlCache<ReputationReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ReputationReservation | undefined {
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

  save(item: ReputationReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ReputationReservation[] {
    return this.inner.list();
  }
}

export function newCachedReputationReservationStore(inner: ReputationReservationStore, ttl: number, clockValue: clock.Clock): ReputationReservationStore {
  return new CachedReputationReservationStore(
    inner,
    cache.newTtlCache<ReputationReservation>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects reputation reservations. Empty fields match all. */
export class ReputationReservationQuery {
  label: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minLimit: number, statuses: string[], limit: number) {
    this.label = label;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ReputationReservation): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ReputationReservation[]): ReputationReservation[] {
    const matched = collections.filter(items, (candidate: ReputationReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findReputationReservations(store: ReputationReservationStore, query: ReputationReservationQuery): ReputationReservation[] {
  return query.apply(store.list());
}
