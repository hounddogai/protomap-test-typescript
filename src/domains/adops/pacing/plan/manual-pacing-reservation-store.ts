import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualPacingReservation } from "./manual-pacing-reservation.js";

/** Keeps manual pacing reservations by code. */
export interface ManualPacingReservationStore {
  find(code: string): ManualPacingReservation | undefined;
  save(item: ManualPacingReservation): void;
  remove(code: string): boolean;
  list(): ManualPacingReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualPacingReservationStore implements ManualPacingReservationStore {
  items: Map<string, ManualPacingReservation>;
  order: string[];

  constructor(items: Map<string, ManualPacingReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualPacingReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualPacingReservation): void {
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

  list(): ManualPacingReservation[] {
    const out: ManualPacingReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualPacingReservationStore(): ManualPacingReservationStore {
  return new MemoryManualPacingReservationStore(new Map<string, ManualPacingReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualPacingReservationStore implements ManualPacingReservationStore {
  inner: ManualPacingReservationStore;
  cache: cache.TtlCache<ManualPacingReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualPacingReservationStore,
    cacheValue: cache.TtlCache<ManualPacingReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualPacingReservation | undefined {
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

  save(item: ManualPacingReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualPacingReservation[] {
    return this.inner.list();
  }
}

export function newCachedManualPacingReservationStore(inner: ManualPacingReservationStore, ttl: number, clockValue: clock.Clock): ManualPacingReservationStore {
  return new CachedManualPacingReservationStore(
    inner,
    cache.newTtlCache<ManualPacingReservation>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects manual pacing reservations. Empty fields match all. */
export class ManualPacingReservationQuery {
  source: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minRevision: number, statuses: string[], limit: number) {
    this.source = source;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualPacingReservation): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualPacingReservation[]): ManualPacingReservation[] {
    const matched = collections.filter(items, (candidate: ManualPacingReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualPacingReservations(store: ManualPacingReservationStore, query: ManualPacingReservationQuery): ManualPacingReservation[] {
  return query.apply(store.list());
}
