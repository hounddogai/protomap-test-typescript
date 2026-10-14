import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedCreditRequest } from "./batched-credit-request.js";

/** Keeps batched credit requests by code. */
export interface BatchedCreditRequestStore {
  find(code: string): BatchedCreditRequest | undefined;
  save(item: BatchedCreditRequest): void;
  remove(code: string): boolean;
  list(): BatchedCreditRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedCreditRequestStore implements BatchedCreditRequestStore {
  items: Map<string, BatchedCreditRequest>;
  order: string[];

  constructor(items: Map<string, BatchedCreditRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedCreditRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedCreditRequest): void {
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

  list(): BatchedCreditRequest[] {
    const out: BatchedCreditRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedCreditRequestStore(): BatchedCreditRequestStore {
  return new MemoryBatchedCreditRequestStore(new Map<string, BatchedCreditRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedCreditRequestStore implements BatchedCreditRequestStore {
  inner: BatchedCreditRequestStore;
  cache: cache.TtlCache<BatchedCreditRequest>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedCreditRequestStore,
    cacheValue: cache.TtlCache<BatchedCreditRequest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedCreditRequest | undefined {
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

  save(item: BatchedCreditRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedCreditRequest[] {
    return this.inner.list();
  }
}

export function newCachedBatchedCreditRequestStore(inner: BatchedCreditRequestStore, ttl: number, clockValue: clock.Clock): BatchedCreditRequestStore {
  return new CachedBatchedCreditRequestStore(
    inner,
    cache.newTtlCache<BatchedCreditRequest>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched credit requests. Empty fields match all. */
export class BatchedCreditRequestQuery {
  name: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minGraceDays: number, statuses: string[], limit: number) {
    this.name = name;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedCreditRequest): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedCreditRequest[]): BatchedCreditRequest[] {
    const matched = collections.filter(items, (candidate: BatchedCreditRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedCreditRequests(store: BatchedCreditRequestStore, query: BatchedCreditRequestQuery): BatchedCreditRequest[] {
  return query.apply(store.list());
}
