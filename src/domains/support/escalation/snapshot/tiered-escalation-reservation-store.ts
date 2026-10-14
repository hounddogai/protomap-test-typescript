import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredEscalationReservation } from "./tiered-escalation-reservation.js";

/** Keeps tiered escalation reservations by code. */
export interface TieredEscalationReservationStore {
  find(code: string): TieredEscalationReservation | undefined;
  save(item: TieredEscalationReservation): void;
  remove(code: string): boolean;
  list(): TieredEscalationReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredEscalationReservationStore implements TieredEscalationReservationStore {
  items: Map<string, TieredEscalationReservation>;
  order: string[];

  constructor(items: Map<string, TieredEscalationReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredEscalationReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredEscalationReservation): void {
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

  list(): TieredEscalationReservation[] {
    const out: TieredEscalationReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredEscalationReservationStore(): TieredEscalationReservationStore {
  return new MemoryTieredEscalationReservationStore(new Map<string, TieredEscalationReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredEscalationReservationStore implements TieredEscalationReservationStore {
  inner: TieredEscalationReservationStore;
  cache: cache.TtlCache<TieredEscalationReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredEscalationReservationStore,
    cacheValue: cache.TtlCache<TieredEscalationReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredEscalationReservation | undefined {
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

  save(item: TieredEscalationReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredEscalationReservation[] {
    return this.inner.list();
  }
}

export function newCachedTieredEscalationReservationStore(inner: TieredEscalationReservationStore, ttl: number, clockValue: clock.Clock): TieredEscalationReservationStore {
  return new CachedTieredEscalationReservationStore(
    inner,
    cache.newTtlCache<TieredEscalationReservation>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered escalation reservations. Empty fields match all. */
export class TieredEscalationReservationQuery {
  utmSource: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minPriority: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredEscalationReservation): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredEscalationReservation[]): TieredEscalationReservation[] {
    const matched = collections.filter(items, (candidate: TieredEscalationReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredEscalationReservations(store: TieredEscalationReservationStore, query: TieredEscalationReservationQuery): TieredEscalationReservation[] {
  return query.apply(store.list());
}
