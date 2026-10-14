import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedSenderBatch } from "./batched-sender-batch.js";

/** Keeps batched sender batches by code. */
export interface BatchedSenderBatchStore {
  find(code: string): BatchedSenderBatch | undefined;
  save(item: BatchedSenderBatch): void;
  remove(code: string): boolean;
  list(): BatchedSenderBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedSenderBatchStore implements BatchedSenderBatchStore {
  items: Map<string, BatchedSenderBatch>;
  order: string[];

  constructor(items: Map<string, BatchedSenderBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedSenderBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedSenderBatch): void {
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

  list(): BatchedSenderBatch[] {
    const out: BatchedSenderBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedSenderBatchStore(): BatchedSenderBatchStore {
  return new MemoryBatchedSenderBatchStore(new Map<string, BatchedSenderBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedSenderBatchStore implements BatchedSenderBatchStore {
  inner: BatchedSenderBatchStore;
  cache: cache.TtlCache<BatchedSenderBatch>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedSenderBatchStore,
    cacheValue: cache.TtlCache<BatchedSenderBatch>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedSenderBatch | undefined {
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

  save(item: BatchedSenderBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedSenderBatch[] {
    return this.inner.list();
  }
}

export function newCachedBatchedSenderBatchStore(inner: BatchedSenderBatchStore, ttl: number, clockValue: clock.Clock): BatchedSenderBatchStore {
  return new CachedBatchedSenderBatchStore(inner, cache.newTtlCache<BatchedSenderBatch>(256, ttl, clockValue), 0, 0);
}

/** Selects batched sender batches. Empty fields match all. */
export class BatchedSenderBatchQuery {
  country: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minOpenRate: number, statuses: string[], limit: number) {
    this.country = country;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedSenderBatch): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedSenderBatch[]): BatchedSenderBatch[] {
    const matched = collections.filter(items, (candidate: BatchedSenderBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedSenderBatches(store: BatchedSenderBatchStore, query: BatchedSenderBatchQuery): BatchedSenderBatch[] {
  return query.apply(store.list());
}
