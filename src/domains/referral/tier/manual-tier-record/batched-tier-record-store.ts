import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedTierRecord } from "./batched-tier-record.js";

/** Keeps batched tier records by code. */
export interface BatchedTierRecordStore {
  find(code: string): BatchedTierRecord | undefined;
  save(item: BatchedTierRecord): void;
  remove(code: string): boolean;
  list(): BatchedTierRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedTierRecordStore implements BatchedTierRecordStore {
  items: Map<string, BatchedTierRecord>;
  order: string[];

  constructor(items: Map<string, BatchedTierRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedTierRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedTierRecord): void {
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

  list(): BatchedTierRecord[] {
    const out: BatchedTierRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedTierRecordStore(): BatchedTierRecordStore {
  return new MemoryBatchedTierRecordStore(new Map<string, BatchedTierRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedTierRecordStore implements BatchedTierRecordStore {
  inner: BatchedTierRecordStore;
  cache: cache.TtlCache<BatchedTierRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedTierRecordStore,
    cacheValue: cache.TtlCache<BatchedTierRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedTierRecord | undefined {
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

  save(item: BatchedTierRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedTierRecord[] {
    return this.inner.list();
  }
}

export function newCachedBatchedTierRecordStore(inner: BatchedTierRecordStore, ttl: number, clockValue: clock.Clock): BatchedTierRecordStore {
  return new CachedBatchedTierRecordStore(inner, cache.newTtlCache<BatchedTierRecord>(64, ttl, clockValue), 0, 0);
}

/** Selects batched tier records. Empty fields match all. */
export class BatchedTierRecordQuery {
  label: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minEndsAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedTierRecord): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedTierRecord[]): BatchedTierRecord[] {
    const matched = collections.filter(items, (candidate: BatchedTierRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedTierRecords(store: BatchedTierRecordStore, query: BatchedTierRecordQuery): BatchedTierRecord[] {
  return query.apply(store.list());
}
