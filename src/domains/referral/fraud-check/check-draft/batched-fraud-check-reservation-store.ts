import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedFraudCheckReservation } from "./batched-fraud-check-reservation.js";

/** Keeps batched fraud check reservations by code. */
export interface BatchedFraudCheckReservationStore {
  find(code: string): BatchedFraudCheckReservation | undefined;
  save(item: BatchedFraudCheckReservation): void;
  remove(code: string): boolean;
  list(): BatchedFraudCheckReservation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedFraudCheckReservationStore implements BatchedFraudCheckReservationStore {
  items: Map<string, BatchedFraudCheckReservation>;
  order: string[];

  constructor(items: Map<string, BatchedFraudCheckReservation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedFraudCheckReservation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedFraudCheckReservation): void {
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

  list(): BatchedFraudCheckReservation[] {
    const out: BatchedFraudCheckReservation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedFraudCheckReservationStore(): BatchedFraudCheckReservationStore {
  return new MemoryBatchedFraudCheckReservationStore(new Map<string, BatchedFraudCheckReservation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedFraudCheckReservationStore implements BatchedFraudCheckReservationStore {
  inner: BatchedFraudCheckReservationStore;
  cache: cache.TtlCache<BatchedFraudCheckReservation>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedFraudCheckReservationStore,
    cacheValue: cache.TtlCache<BatchedFraudCheckReservation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedFraudCheckReservation | undefined {
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

  save(item: BatchedFraudCheckReservation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedFraudCheckReservation[] {
    return this.inner.list();
  }
}

export function newCachedBatchedFraudCheckReservationStore(inner: BatchedFraudCheckReservationStore, ttl: number, clockValue: clock.Clock): BatchedFraudCheckReservationStore {
  return new CachedBatchedFraudCheckReservationStore(
    inner,
    cache.newTtlCache<BatchedFraudCheckReservation>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched fraud check reservations. Empty fields match all. */
export class BatchedFraudCheckReservationQuery {
  source: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minBatchSize: number, statuses: string[], limit: number) {
    this.source = source;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedFraudCheckReservation): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedFraudCheckReservation[]): BatchedFraudCheckReservation[] {
    const matched = collections.filter(items, (candidate: BatchedFraudCheckReservation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedFraudCheckReservations(store: BatchedFraudCheckReservationStore, query: BatchedFraudCheckReservationQuery): BatchedFraudCheckReservation[] {
  return query.apply(store.list());
}
