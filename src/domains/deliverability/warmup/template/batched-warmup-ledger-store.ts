import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedWarmupLedger } from "./batched-warmup-ledger.js";

/** Keeps batched warmup ledgers by code. */
export interface BatchedWarmupLedgerStore {
  find(code: string): BatchedWarmupLedger | undefined;
  save(item: BatchedWarmupLedger): void;
  remove(code: string): boolean;
  list(): BatchedWarmupLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedWarmupLedgerStore implements BatchedWarmupLedgerStore {
  items: Map<string, BatchedWarmupLedger>;
  order: string[];

  constructor(items: Map<string, BatchedWarmupLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedWarmupLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedWarmupLedger): void {
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

  list(): BatchedWarmupLedger[] {
    const out: BatchedWarmupLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedWarmupLedgerStore(): BatchedWarmupLedgerStore {
  return new MemoryBatchedWarmupLedgerStore(new Map<string, BatchedWarmupLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedWarmupLedgerStore implements BatchedWarmupLedgerStore {
  inner: BatchedWarmupLedgerStore;
  cache: cache.TtlCache<BatchedWarmupLedger>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedWarmupLedgerStore,
    cacheValue: cache.TtlCache<BatchedWarmupLedger>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedWarmupLedger | undefined {
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

  save(item: BatchedWarmupLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedWarmupLedger[] {
    return this.inner.list();
  }
}

export function newCachedBatchedWarmupLedgerStore(inner: BatchedWarmupLedgerStore, ttl: number, clockValue: clock.Clock): BatchedWarmupLedgerStore {
  return new CachedBatchedWarmupLedgerStore(inner, cache.newTtlCache<BatchedWarmupLedger>(512, ttl, clockValue), 0, 0);
}

/** Selects batched warmup ledgers. Empty fields match all. */
export class BatchedWarmupLedgerQuery {
  title: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedWarmupLedger): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedWarmupLedger[]): BatchedWarmupLedger[] {
    const matched = collections.filter(items, (candidate: BatchedWarmupLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedWarmupLedgers(store: BatchedWarmupLedgerStore, query: BatchedWarmupLedgerQuery): BatchedWarmupLedger[] {
  return query.apply(store.list());
}
