import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedWarmupReservation } from "./capped-warmup-reservation.js";

/** Keeps capped warmup reservations by code. */
export interface CappedWarmupReservationStore {
  find(code: string): CappedWarmupReservation | undefined;
  save(item: CappedWarmupReservation): void;
  remove(code: string): boolean;
  list(): CappedWarmupReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedWarmupReservationStore implements CappedWarmupReservationStore {
  items: Map<string, CappedWarmupReservation>;
  order: string[];

  constructor(items: Map<string, CappedWarmupReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedWarmupReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedWarmupReservation): void {
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

  list(): CappedWarmupReservation[] {
    const out: CappedWarmupReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedWarmupReservationStore(): CappedWarmupReservationStore {
  return new MemoryCappedWarmupReservationStore(new Map<string, CappedWarmupReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedWarmupReservationStore implements CappedWarmupReservationStore {
  inner: CappedWarmupReservationStore;
  cache: cache.TtlCache<CappedWarmupReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedWarmupReservationStore,
    cacheValue: cache.TtlCache<CappedWarmupReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedWarmupReservation | undefined {
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

  save(item: CappedWarmupReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedWarmupReservation[] {
    return this.inner.list();
  }
}

export function newCachedCappedWarmupReservationStore(inner: CappedWarmupReservationStore, ttl: number, clockValue: clock.Clock): CappedWarmupReservationStore {
  return new CachedCappedWarmupReservationStore(
    inner,
    cache.newTtlCache<CappedWarmupReservation>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects capped warmup reservations. Empty fields match all. */
export class CappedWarmupReservationQuery {
  name: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minMargin: number, statuses: string[], limit: number) {
    this.name = name;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedWarmupReservation): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedWarmupReservation[]): CappedWarmupReservation[] {
    const matched = collections.filter(items, (candidate: CappedWarmupReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedWarmupReservations(store: CappedWarmupReservationStore, query: CappedWarmupReservationQuery): CappedWarmupReservation[] {
  return query.apply(store.list());
}
