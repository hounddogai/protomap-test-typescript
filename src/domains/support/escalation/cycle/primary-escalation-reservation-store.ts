import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryEscalationReservation } from "./primary-escalation-reservation.js";

/** Keeps primary escalation reservations by code. */
export interface PrimaryEscalationReservationStore {
  find(code: string): PrimaryEscalationReservation | undefined;
  save(item: PrimaryEscalationReservation): void;
  remove(code: string): boolean;
  list(): PrimaryEscalationReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryEscalationReservationStore implements PrimaryEscalationReservationStore {
  items: Map<string, PrimaryEscalationReservation>;
  order: string[];

  constructor(items: Map<string, PrimaryEscalationReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryEscalationReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryEscalationReservation): void {
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

  list(): PrimaryEscalationReservation[] {
    const out: PrimaryEscalationReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryEscalationReservationStore(): PrimaryEscalationReservationStore {
  return new MemoryPrimaryEscalationReservationStore(new Map<string, PrimaryEscalationReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryEscalationReservationStore implements PrimaryEscalationReservationStore {
  inner: PrimaryEscalationReservationStore;
  cache: cache.TtlCache<PrimaryEscalationReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryEscalationReservationStore,
    cacheValue: cache.TtlCache<PrimaryEscalationReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryEscalationReservation | undefined {
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

  save(item: PrimaryEscalationReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryEscalationReservation[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryEscalationReservationStore(inner: PrimaryEscalationReservationStore, ttl: number, clockValue: clock.Clock): PrimaryEscalationReservationStore {
  return new CachedPrimaryEscalationReservationStore(
    inner,
    cache.newTtlCache<PrimaryEscalationReservation>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary escalation reservations. Empty fields match all. */
export class PrimaryEscalationReservationQuery {
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

  matches(item: PrimaryEscalationReservation): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryEscalationReservation[]): PrimaryEscalationReservation[] {
    const matched = collections.filter(items, (candidate: PrimaryEscalationReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryEscalationReservations(store: PrimaryEscalationReservationStore, query: PrimaryEscalationReservationQuery): PrimaryEscalationReservation[] {
  return query.apply(store.list());
}
