import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedMentionLedger } from "./batched-mention-ledger.js";

/** Keeps batched mention ledgers by code. */
export interface BatchedMentionLedgerStore {
  find(code: string): BatchedMentionLedger | undefined;
  save(item: BatchedMentionLedger): void;
  remove(code: string): boolean;
  list(): BatchedMentionLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedMentionLedgerStore implements BatchedMentionLedgerStore {
  items: Map<string, BatchedMentionLedger>;
  order: string[];

  constructor(items: Map<string, BatchedMentionLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedMentionLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedMentionLedger): void {
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

  list(): BatchedMentionLedger[] {
    const out: BatchedMentionLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedMentionLedgerStore(): BatchedMentionLedgerStore {
  return new MemoryBatchedMentionLedgerStore(new Map<string, BatchedMentionLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedMentionLedgerStore implements BatchedMentionLedgerStore {
  inner: BatchedMentionLedgerStore;
  cache: cache.TtlCache<BatchedMentionLedger>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedMentionLedgerStore,
    cacheValue: cache.TtlCache<BatchedMentionLedger>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedMentionLedger | undefined {
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

  save(item: BatchedMentionLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedMentionLedger[] {
    return this.inner.list();
  }
}

export function newCachedBatchedMentionLedgerStore(inner: BatchedMentionLedgerStore, ttl: number, clockValue: clock.Clock): BatchedMentionLedgerStore {
  return new CachedBatchedMentionLedgerStore(
    inner,
    cache.newTtlCache<BatchedMentionLedger>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched mention ledgers. Empty fields match all. */
export class BatchedMentionLedgerQuery {
  category: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minConversionRate: number, statuses: string[], limit: number) {
    this.category = category;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedMentionLedger): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedMentionLedger[]): BatchedMentionLedger[] {
    const matched = collections.filter(items, (candidate: BatchedMentionLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedMentionLedgers(store: BatchedMentionLedgerStore, query: BatchedMentionLedgerQuery): BatchedMentionLedger[] {
  return query.apply(store.list());
}
