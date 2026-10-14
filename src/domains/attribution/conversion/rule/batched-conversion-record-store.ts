import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedConversionRecord } from "./batched-conversion-record.js";

/** Keeps batched conversion records by code. */
export interface BatchedConversionRecordStore {
  find(code: string): BatchedConversionRecord | undefined;
  save(item: BatchedConversionRecord): void;
  remove(code: string): boolean;
  list(): BatchedConversionRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedConversionRecordStore implements BatchedConversionRecordStore {
  items: Map<string, BatchedConversionRecord>;
  order: string[];

  constructor(items: Map<string, BatchedConversionRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedConversionRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedConversionRecord): void {
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

  list(): BatchedConversionRecord[] {
    const out: BatchedConversionRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedConversionRecordStore(): BatchedConversionRecordStore {
  return new MemoryBatchedConversionRecordStore(new Map<string, BatchedConversionRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedConversionRecordStore implements BatchedConversionRecordStore {
  inner: BatchedConversionRecordStore;
  cache: cache.TtlCache<BatchedConversionRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedConversionRecordStore,
    cacheValue: cache.TtlCache<BatchedConversionRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedConversionRecord | undefined {
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

  save(item: BatchedConversionRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedConversionRecord[] {
    return this.inner.list();
  }
}

export function newCachedBatchedConversionRecordStore(inner: BatchedConversionRecordStore, ttl: number, clockValue: clock.Clock): BatchedConversionRecordStore {
  return new CachedBatchedConversionRecordStore(
    inner,
    cache.newTtlCache<BatchedConversionRecord>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched conversion records. Empty fields match all. */
export class BatchedConversionRecordQuery {
  label: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minLimit: number, statuses: string[], limit: number) {
    this.label = label;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedConversionRecord): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedConversionRecord[]): BatchedConversionRecord[] {
    const matched = collections.filter(items, (candidate: BatchedConversionRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedConversionRecords(store: BatchedConversionRecordStore, query: BatchedConversionRecordQuery): BatchedConversionRecord[] {
  return query.apply(store.list());
}
