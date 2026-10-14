import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyDoubleOptInReservation } from "./legacy-double-opt-in-reservation.js";

/** Keeps legacy double opt in reservations by code. */
export interface LegacyDoubleOptInReservationStore {
  find(code: string): LegacyDoubleOptInReservation | undefined;
  save(item: LegacyDoubleOptInReservation): void;
  remove(code: string): boolean;
  list(): LegacyDoubleOptInReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyDoubleOptInReservationStore implements LegacyDoubleOptInReservationStore {
  items: Map<string, LegacyDoubleOptInReservation>;
  order: string[];

  constructor(items: Map<string, LegacyDoubleOptInReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyDoubleOptInReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyDoubleOptInReservation): void {
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

  list(): LegacyDoubleOptInReservation[] {
    const out: LegacyDoubleOptInReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyDoubleOptInReservationStore(): LegacyDoubleOptInReservationStore {
  return new MemoryLegacyDoubleOptInReservationStore(new Map<string, LegacyDoubleOptInReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyDoubleOptInReservationStore implements LegacyDoubleOptInReservationStore {
  inner: LegacyDoubleOptInReservationStore;
  cache: cache.TtlCache<LegacyDoubleOptInReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyDoubleOptInReservationStore,
    cacheValue: cache.TtlCache<LegacyDoubleOptInReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyDoubleOptInReservation | undefined {
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

  save(item: LegacyDoubleOptInReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyDoubleOptInReservation[] {
    return this.inner.list();
  }
}

export function newCachedLegacyDoubleOptInReservationStore(inner: LegacyDoubleOptInReservationStore, ttl: number, clockValue: clock.Clock): LegacyDoubleOptInReservationStore {
  return new CachedLegacyDoubleOptInReservationStore(
    inner,
    cache.newTtlCache<LegacyDoubleOptInReservation>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy double opt in reservations. Empty fields match all. */
export class LegacyDoubleOptInReservationQuery {
  locale: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minAmount: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyDoubleOptInReservation): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyDoubleOptInReservation[]): LegacyDoubleOptInReservation[] {
    const matched = collections.filter(items, (candidate: LegacyDoubleOptInReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyDoubleOptInReservations(store: LegacyDoubleOptInReservationStore, query: LegacyDoubleOptInReservationQuery): LegacyDoubleOptInReservation[] {
  return query.apply(store.list());
}
