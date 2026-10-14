import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedCreditLedger } from "./batched-credit-ledger.js";

/** Keeps batched credit ledgers by code. */
export interface BatchedCreditLedgerStore {
  find(code: string): BatchedCreditLedger | undefined;
  save(item: BatchedCreditLedger): void;
  remove(code: string): boolean;
  list(): BatchedCreditLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedCreditLedgerStore implements BatchedCreditLedgerStore {
  items: Map<string, BatchedCreditLedger>;
  order: string[];

  constructor(items: Map<string, BatchedCreditLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedCreditLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedCreditLedger): void {
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

  list(): BatchedCreditLedger[] {
    const out: BatchedCreditLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedCreditLedgerStore(): BatchedCreditLedgerStore {
  return new MemoryBatchedCreditLedgerStore(new Map<string, BatchedCreditLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedCreditLedgerStore implements BatchedCreditLedgerStore {
  inner: BatchedCreditLedgerStore;
  cache: cache.TtlCache<BatchedCreditLedger>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedCreditLedgerStore,
    cacheValue: cache.TtlCache<BatchedCreditLedger>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedCreditLedger | undefined {
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

  save(item: BatchedCreditLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedCreditLedger[] {
    return this.inner.list();
  }
}

export function newCachedBatchedCreditLedgerStore(inner: BatchedCreditLedgerStore, ttl: number, clockValue: clock.Clock): BatchedCreditLedgerStore {
  return new CachedBatchedCreditLedgerStore(inner, cache.newTtlCache<BatchedCreditLedger>(64, ttl, clockValue), 0, 0);
}

/** Selects batched credit ledgers. Empty fields match all. */
export class BatchedCreditLedgerQuery {
  label: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minAttempts: number, statuses: string[], limit: number) {
    this.label = label;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedCreditLedger): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedCreditLedger[]): BatchedCreditLedger[] {
    const matched = collections.filter(items, (candidate: BatchedCreditLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedCreditLedgers(store: BatchedCreditLedgerStore, query: BatchedCreditLedgerQuery): BatchedCreditLedger[] {
  return query.apply(store.list());
}
