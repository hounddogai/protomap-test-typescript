import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedWindowBatch } from "./batched-window-batch.js";

/** Keeps batched window batches by code. */
export interface BatchedWindowBatchStore {
  find(code: string): BatchedWindowBatch | undefined;
  save(item: BatchedWindowBatch): void;
  remove(code: string): boolean;
  list(): BatchedWindowBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedWindowBatchStore implements BatchedWindowBatchStore {
  items: Map<string, BatchedWindowBatch>;
  order: string[];

  constructor(items: Map<string, BatchedWindowBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedWindowBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedWindowBatch): void {
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

  list(): BatchedWindowBatch[] {
    const out: BatchedWindowBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedWindowBatchStore(): BatchedWindowBatchStore {
  return new MemoryBatchedWindowBatchStore(new Map<string, BatchedWindowBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedWindowBatchStore implements BatchedWindowBatchStore {
  inner: BatchedWindowBatchStore;
  cache: cache.TtlCache<BatchedWindowBatch>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedWindowBatchStore,
    cacheValue: cache.TtlCache<BatchedWindowBatch>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedWindowBatch | undefined {
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

  save(item: BatchedWindowBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedWindowBatch[] {
    return this.inner.list();
  }
}

export function newCachedBatchedWindowBatchStore(inner: BatchedWindowBatchStore, ttl: number, clockValue: clock.Clock): BatchedWindowBatchStore {
  return new CachedBatchedWindowBatchStore(inner, cache.newTtlCache<BatchedWindowBatch>(256, ttl, clockValue), 0, 0);
}

/** Selects batched window batches. Empty fields match all. */
export class BatchedWindowBatchQuery {
  label: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minDiscount: number, statuses: string[], limit: number) {
    this.label = label;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedWindowBatch): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedWindowBatch[]): BatchedWindowBatch[] {
    const matched = collections.filter(items, (candidate: BatchedWindowBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedWindowBatches(store: BatchedWindowBatchStore, query: BatchedWindowBatchQuery): BatchedWindowBatch[] {
  return query.apply(store.list());
}
