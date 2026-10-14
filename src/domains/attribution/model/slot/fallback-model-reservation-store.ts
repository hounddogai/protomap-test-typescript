import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackModelReservation } from "./fallback-model-reservation.js";

/** Keeps fallback model reservations by code. */
export interface FallbackModelReservationStore {
  find(code: string): FallbackModelReservation | undefined;
  save(item: FallbackModelReservation): void;
  remove(code: string): boolean;
  list(): FallbackModelReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackModelReservationStore implements FallbackModelReservationStore {
  items: Map<string, FallbackModelReservation>;
  order: string[];

  constructor(items: Map<string, FallbackModelReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackModelReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackModelReservation): void {
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

  list(): FallbackModelReservation[] {
    const out: FallbackModelReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackModelReservationStore(): FallbackModelReservationStore {
  return new MemoryFallbackModelReservationStore(new Map<string, FallbackModelReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackModelReservationStore implements FallbackModelReservationStore {
  inner: FallbackModelReservationStore;
  cache: cache.TtlCache<FallbackModelReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackModelReservationStore,
    cacheValue: cache.TtlCache<FallbackModelReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackModelReservation | undefined {
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

  save(item: FallbackModelReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackModelReservation[] {
    return this.inner.list();
  }
}

export function newCachedFallbackModelReservationStore(inner: FallbackModelReservationStore, ttl: number, clockValue: clock.Clock): FallbackModelReservationStore {
  return new CachedFallbackModelReservationStore(
    inner,
    cache.newTtlCache<FallbackModelReservation>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback model reservations. Empty fields match all. */
export class FallbackModelReservationQuery {
  label: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minMargin: number, statuses: string[], limit: number) {
    this.label = label;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackModelReservation): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackModelReservation[]): FallbackModelReservation[] {
    const matched = collections.filter(items, (candidate: FallbackModelReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackModelReservations(store: FallbackModelReservationStore, query: FallbackModelReservationQuery): FallbackModelReservation[] {
  return query.apply(store.list());
}
