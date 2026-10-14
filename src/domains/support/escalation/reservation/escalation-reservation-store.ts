import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { EscalationReservation } from "./escalation-reservation.js";

/** Keeps escalation reservations by code. */
export interface EscalationReservationStore {
  find(code: string): EscalationReservation | undefined;
  save(item: EscalationReservation): void;
  remove(code: string): boolean;
  list(): EscalationReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryEscalationReservationStore implements EscalationReservationStore {
  items: Map<string, EscalationReservation>;
  order: string[];

  constructor(items: Map<string, EscalationReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): EscalationReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: EscalationReservation): void {
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

  list(): EscalationReservation[] {
    const out: EscalationReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryEscalationReservationStore(): EscalationReservationStore {
  return new MemoryEscalationReservationStore(new Map<string, EscalationReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedEscalationReservationStore implements EscalationReservationStore {
  inner: EscalationReservationStore;
  cache: cache.TtlCache<EscalationReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: EscalationReservationStore,
    cacheValue: cache.TtlCache<EscalationReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): EscalationReservation | undefined {
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

  save(item: EscalationReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): EscalationReservation[] {
    return this.inner.list();
  }
}

export function newCachedEscalationReservationStore(inner: EscalationReservationStore, ttl: number, clockValue: clock.Clock): EscalationReservationStore {
  return new CachedEscalationReservationStore(
    inner,
    cache.newTtlCache<EscalationReservation>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects escalation reservations. Empty fields match all. */
export class EscalationReservationQuery {
  title: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minRatio: number, statuses: string[], limit: number) {
    this.title = title;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: EscalationReservation): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: EscalationReservation[]): EscalationReservation[] {
    const matched = collections.filter(items, (candidate: EscalationReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findEscalationReservations(store: EscalationReservationStore, query: EscalationReservationQuery): EscalationReservation[] {
  return query.apply(store.list());
}
