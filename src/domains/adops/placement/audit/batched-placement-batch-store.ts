import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedPlacementBatch } from "./batched-placement-batch.js";

/** Keeps batched placement batches by code. */
export interface BatchedPlacementBatchStore {
  find(code: string): BatchedPlacementBatch | undefined;
  save(item: BatchedPlacementBatch): void;
  remove(code: string): boolean;
  list(): BatchedPlacementBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedPlacementBatchStore implements BatchedPlacementBatchStore {
  items: Map<string, BatchedPlacementBatch>;
  order: string[];

  constructor(items: Map<string, BatchedPlacementBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedPlacementBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedPlacementBatch): void {
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

  list(): BatchedPlacementBatch[] {
    const out: BatchedPlacementBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedPlacementBatchStore(): BatchedPlacementBatchStore {
  return new MemoryBatchedPlacementBatchStore(new Map<string, BatchedPlacementBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedPlacementBatchStore implements BatchedPlacementBatchStore {
  inner: BatchedPlacementBatchStore;
  cache: cache.TtlCache<BatchedPlacementBatch>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedPlacementBatchStore,
    cacheValue: cache.TtlCache<BatchedPlacementBatch>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedPlacementBatch | undefined {
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

  save(item: BatchedPlacementBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedPlacementBatch[] {
    return this.inner.list();
  }
}

export function newCachedBatchedPlacementBatchStore(inner: BatchedPlacementBatchStore, ttl: number, clockValue: clock.Clock): BatchedPlacementBatchStore {
  return new CachedBatchedPlacementBatchStore(
    inner,
    cache.newTtlCache<BatchedPlacementBatch>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched placement batches. Empty fields match all. */
export class BatchedPlacementBatchQuery {
  country: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.country = country;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedPlacementBatch): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedPlacementBatch[]): BatchedPlacementBatch[] {
    const matched = collections.filter(items, (candidate: BatchedPlacementBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedPlacementBatches(store: BatchedPlacementBatchStore, query: BatchedPlacementBatchQuery): BatchedPlacementBatch[] {
  return query.apply(store.list());
}
