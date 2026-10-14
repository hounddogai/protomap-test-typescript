import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedModelEntry } from "./batched-model-entry.js";

/** Keeps batched model entries by code. */
export interface BatchedModelEntryStore {
  find(code: string): BatchedModelEntry | undefined;
  save(item: BatchedModelEntry): void;
  remove(code: string): boolean;
  list(): BatchedModelEntry[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedModelEntryStore implements BatchedModelEntryStore {
  items: Map<string, BatchedModelEntry>;
  order: string[];

  constructor(items: Map<string, BatchedModelEntry>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedModelEntry | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedModelEntry): void {
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

  list(): BatchedModelEntry[] {
    const out: BatchedModelEntry[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedModelEntryStore(): BatchedModelEntryStore {
  return new MemoryBatchedModelEntryStore(new Map<string, BatchedModelEntry>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedModelEntryStore implements BatchedModelEntryStore {
  inner: BatchedModelEntryStore;
  cache: cache.TtlCache<BatchedModelEntry>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedModelEntryStore,
    cacheValue: cache.TtlCache<BatchedModelEntry>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedModelEntry | undefined {
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

  save(item: BatchedModelEntry): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedModelEntry[] {
    return this.inner.list();
  }
}

export function newCachedBatchedModelEntryStore(inner: BatchedModelEntryStore, ttl: number, clockValue: clock.Clock): BatchedModelEntryStore {
  return new CachedBatchedModelEntryStore(inner, cache.newTtlCache<BatchedModelEntry>(64, ttl, clockValue), 0, 0);
}

/** Selects batched model entries. Empty fields match all. */
export class BatchedModelEntryQuery {
  title: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minBid: number, statuses: string[], limit: number) {
    this.title = title;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedModelEntry): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedModelEntry[]): BatchedModelEntry[] {
    const matched = collections.filter(items, (candidate: BatchedModelEntry): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedModelEntries(store: BatchedModelEntryStore, query: BatchedModelEntryQuery): BatchedModelEntry[] {
  return query.apply(store.list());
}
