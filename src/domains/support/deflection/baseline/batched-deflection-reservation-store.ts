import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedDeflectionReservation } from "./batched-deflection-reservation.js";

/** Keeps batched deflection reservations by code. */
export interface BatchedDeflectionReservationStore {
  find(code: string): BatchedDeflectionReservation | undefined;
  save(item: BatchedDeflectionReservation): void;
  remove(code: string): boolean;
  list(): BatchedDeflectionReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedDeflectionReservationStore implements BatchedDeflectionReservationStore {
  items: Map<string, BatchedDeflectionReservation>;
  order: string[];

  constructor(items: Map<string, BatchedDeflectionReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedDeflectionReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedDeflectionReservation): void {
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

  list(): BatchedDeflectionReservation[] {
    const out: BatchedDeflectionReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedDeflectionReservationStore(): BatchedDeflectionReservationStore {
  return new MemoryBatchedDeflectionReservationStore(new Map<string, BatchedDeflectionReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedDeflectionReservationStore implements BatchedDeflectionReservationStore {
  inner: BatchedDeflectionReservationStore;
  cache: cache.TtlCache<BatchedDeflectionReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedDeflectionReservationStore,
    cacheValue: cache.TtlCache<BatchedDeflectionReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedDeflectionReservation | undefined {
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

  save(item: BatchedDeflectionReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedDeflectionReservation[] {
    return this.inner.list();
  }
}

export function newCachedBatchedDeflectionReservationStore(inner: BatchedDeflectionReservationStore, ttl: number, clockValue: clock.Clock): BatchedDeflectionReservationStore {
  return new CachedBatchedDeflectionReservationStore(
    inner,
    cache.newTtlCache<BatchedDeflectionReservation>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched deflection reservations. Empty fields match all. */
export class BatchedDeflectionReservationQuery {
  label: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minWindowDays: number, statuses: string[], limit: number) {
    this.label = label;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedDeflectionReservation): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedDeflectionReservation[]): BatchedDeflectionReservation[] {
    const matched = collections.filter(items, (candidate: BatchedDeflectionReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedDeflectionReservations(store: BatchedDeflectionReservationStore, query: BatchedDeflectionReservationQuery): BatchedDeflectionReservation[] {
  return query.apply(store.list());
}
