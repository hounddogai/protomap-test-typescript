import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedLevelRequest } from "./batched-level-request.js";

/** Keeps batched level requests by code. */
export interface BatchedLevelRequestStore {
  find(code: string): BatchedLevelRequest | undefined;
  save(item: BatchedLevelRequest): void;
  remove(code: string): boolean;
  list(): BatchedLevelRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedLevelRequestStore implements BatchedLevelRequestStore {
  items: Map<string, BatchedLevelRequest>;
  order: string[];

  constructor(items: Map<string, BatchedLevelRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedLevelRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedLevelRequest): void {
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

  list(): BatchedLevelRequest[] {
    const out: BatchedLevelRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedLevelRequestStore(): BatchedLevelRequestStore {
  return new MemoryBatchedLevelRequestStore(new Map<string, BatchedLevelRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedLevelRequestStore implements BatchedLevelRequestStore {
  inner: BatchedLevelRequestStore;
  cache: cache.TtlCache<BatchedLevelRequest>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedLevelRequestStore,
    cacheValue: cache.TtlCache<BatchedLevelRequest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedLevelRequest | undefined {
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

  save(item: BatchedLevelRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedLevelRequest[] {
    return this.inner.list();
  }
}

export function newCachedBatchedLevelRequestStore(inner: BatchedLevelRequestStore, ttl: number, clockValue: clock.Clock): BatchedLevelRequestStore {
  return new CachedBatchedLevelRequestStore(inner, cache.newTtlCache<BatchedLevelRequest>(1024, ttl, clockValue), 0, 0);
}

/** Selects batched level requests. Empty fields match all. */
export class BatchedLevelRequestQuery {
  title: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minDiscount: number, statuses: string[], limit: number) {
    this.title = title;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedLevelRequest): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedLevelRequest[]): BatchedLevelRequest[] {
    const matched = collections.filter(items, (candidate: BatchedLevelRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedLevelRequests(store: BatchedLevelRequestStore, query: BatchedLevelRequestQuery): BatchedLevelRequest[] {
  return query.apply(store.list());
}
