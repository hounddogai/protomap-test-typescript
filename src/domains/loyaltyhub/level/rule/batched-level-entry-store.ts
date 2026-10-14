import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedLevelEntry } from "./batched-level-entry.js";

/** Keeps batched level entries by code. */
export interface BatchedLevelEntryStore {
  find(code: string): BatchedLevelEntry | undefined;
  save(item: BatchedLevelEntry): void;
  remove(code: string): boolean;
  list(): BatchedLevelEntry[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedLevelEntryStore implements BatchedLevelEntryStore {
  items: Map<string, BatchedLevelEntry>;
  order: string[];

  constructor(items: Map<string, BatchedLevelEntry>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedLevelEntry | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedLevelEntry): void {
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

  list(): BatchedLevelEntry[] {
    const out: BatchedLevelEntry[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedLevelEntryStore(): BatchedLevelEntryStore {
  return new MemoryBatchedLevelEntryStore(new Map<string, BatchedLevelEntry>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedLevelEntryStore implements BatchedLevelEntryStore {
  inner: BatchedLevelEntryStore;
  cache: cache.TtlCache<BatchedLevelEntry>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedLevelEntryStore,
    cacheValue: cache.TtlCache<BatchedLevelEntry>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedLevelEntry | undefined {
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

  save(item: BatchedLevelEntry): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedLevelEntry[] {
    return this.inner.list();
  }
}

export function newCachedBatchedLevelEntryStore(inner: BatchedLevelEntryStore, ttl: number, clockValue: clock.Clock): BatchedLevelEntryStore {
  return new CachedBatchedLevelEntryStore(inner, cache.newTtlCache<BatchedLevelEntry>(128, ttl, clockValue), 0, 0);
}

/** Selects batched level entries. Empty fields match all. */
export class BatchedLevelEntryQuery {
  locale: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minBatchSize: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedLevelEntry): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedLevelEntry[]): BatchedLevelEntry[] {
    const matched = collections.filter(items, (candidate: BatchedLevelEntry): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedLevelEntries(store: BatchedLevelEntryStore, query: BatchedLevelEntryQuery): BatchedLevelEntry[] {
  return query.apply(store.list());
}
