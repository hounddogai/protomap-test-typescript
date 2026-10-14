import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WarmupReservation } from "./warmup-reservation.js";

/** Keeps warmup reservations by code. */
export interface WarmupReservationStore {
  find(code: string): WarmupReservation | undefined;
  save(item: WarmupReservation): void;
  remove(code: string): boolean;
  list(): WarmupReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWarmupReservationStore implements WarmupReservationStore {
  items: Map<string, WarmupReservation>;
  order: string[];

  constructor(items: Map<string, WarmupReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WarmupReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WarmupReservation): void {
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

  list(): WarmupReservation[] {
    const out: WarmupReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWarmupReservationStore(): WarmupReservationStore {
  return new MemoryWarmupReservationStore(new Map<string, WarmupReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWarmupReservationStore implements WarmupReservationStore {
  inner: WarmupReservationStore;
  cache: cache.TtlCache<WarmupReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: WarmupReservationStore,
    cacheValue: cache.TtlCache<WarmupReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WarmupReservation | undefined {
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

  save(item: WarmupReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WarmupReservation[] {
    return this.inner.list();
  }
}

export function newCachedWarmupReservationStore(inner: WarmupReservationStore, ttl: number, clockValue: clock.Clock): WarmupReservationStore {
  return new CachedWarmupReservationStore(inner, cache.newTtlCache<WarmupReservation>(128, ttl, clockValue), 0, 0);
}

/** Selects warmup reservations. Empty fields match all. */
export class WarmupReservationQuery {
  unit: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minWeight: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WarmupReservation): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WarmupReservation[]): WarmupReservation[] {
    const matched = collections.filter(items, (candidate: WarmupReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWarmupReservations(store: WarmupReservationStore, query: WarmupReservationQuery): WarmupReservation[] {
  return query.apply(store.list());
}
