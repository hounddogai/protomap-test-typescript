import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedWarmupReservation } from "./batched-warmup-reservation.js";

/** Keeps batched warmup reservations by code. */
export interface BatchedWarmupReservationStore {
  find(code: string): BatchedWarmupReservation | undefined;
  save(item: BatchedWarmupReservation): void;
  remove(code: string): boolean;
  list(): BatchedWarmupReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedWarmupReservationStore implements BatchedWarmupReservationStore {
  items: Map<string, BatchedWarmupReservation>;
  order: string[];

  constructor(items: Map<string, BatchedWarmupReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedWarmupReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedWarmupReservation): void {
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

  list(): BatchedWarmupReservation[] {
    const out: BatchedWarmupReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedWarmupReservationStore(): BatchedWarmupReservationStore {
  return new MemoryBatchedWarmupReservationStore(new Map<string, BatchedWarmupReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedWarmupReservationStore implements BatchedWarmupReservationStore {
  inner: BatchedWarmupReservationStore;
  cache: cache.TtlCache<BatchedWarmupReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedWarmupReservationStore,
    cacheValue: cache.TtlCache<BatchedWarmupReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedWarmupReservation | undefined {
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

  save(item: BatchedWarmupReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedWarmupReservation[] {
    return this.inner.list();
  }
}

export function newCachedBatchedWarmupReservationStore(inner: BatchedWarmupReservationStore, ttl: number, clockValue: clock.Clock): BatchedWarmupReservationStore {
  return new CachedBatchedWarmupReservationStore(
    inner,
    cache.newTtlCache<BatchedWarmupReservation>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched warmup reservations. Empty fields match all. */
export class BatchedWarmupReservationQuery {
  unit: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedWarmupReservation): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedWarmupReservation[]): BatchedWarmupReservation[] {
    const matched = collections.filter(items, (candidate: BatchedWarmupReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedWarmupReservations(store: BatchedWarmupReservationStore, query: BatchedWarmupReservationQuery): BatchedWarmupReservation[] {
  return query.apply(store.list());
}
