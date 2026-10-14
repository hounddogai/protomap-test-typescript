import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedCsatEntry } from "./batched-csat-entry.js";

/** Keeps batched csat entries by code. */
export interface BatchedCsatEntryStore {
  find(code: string): BatchedCsatEntry | undefined;
  save(item: BatchedCsatEntry): void;
  remove(code: string): boolean;
  list(): BatchedCsatEntry[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedCsatEntryStore implements BatchedCsatEntryStore {
  items: Map<string, BatchedCsatEntry>;
  order: string[];

  constructor(items: Map<string, BatchedCsatEntry>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedCsatEntry | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedCsatEntry): void {
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

  list(): BatchedCsatEntry[] {
    const out: BatchedCsatEntry[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedCsatEntryStore(): BatchedCsatEntryStore {
  return new MemoryBatchedCsatEntryStore(new Map<string, BatchedCsatEntry>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedCsatEntryStore implements BatchedCsatEntryStore {
  inner: BatchedCsatEntryStore;
  cache: cache.TtlCache<BatchedCsatEntry>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedCsatEntryStore,
    cacheValue: cache.TtlCache<BatchedCsatEntry>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedCsatEntry | undefined {
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

  save(item: BatchedCsatEntry): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedCsatEntry[] {
    return this.inner.list();
  }
}

export function newCachedBatchedCsatEntryStore(inner: BatchedCsatEntryStore, ttl: number, clockValue: clock.Clock): BatchedCsatEntryStore {
  return new CachedBatchedCsatEntryStore(inner, cache.newTtlCache<BatchedCsatEntry>(64, ttl, clockValue), 0, 0);
}

/** Selects batched csat entries. Empty fields match all. */
export class BatchedCsatEntryQuery {
  title: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minAttempts: number, statuses: string[], limit: number) {
    this.title = title;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedCsatEntry): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedCsatEntry[]): BatchedCsatEntry[] {
    const matched = collections.filter(items, (candidate: BatchedCsatEntry): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedCsatEntries(store: BatchedCsatEntryStore, query: BatchedCsatEntryQuery): BatchedCsatEntry[] {
  return query.apply(store.list());
}
