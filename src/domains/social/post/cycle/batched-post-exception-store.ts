import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedPostException } from "./batched-post-exception.js";

/** Keeps batched post exceptions by code. */
export interface BatchedPostExceptionStore {
  find(code: string): BatchedPostException | undefined;
  save(item: BatchedPostException): void;
  remove(code: string): boolean;
  list(): BatchedPostException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedPostExceptionStore implements BatchedPostExceptionStore {
  items: Map<string, BatchedPostException>;
  order: string[];

  constructor(items: Map<string, BatchedPostException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedPostException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedPostException): void {
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

  list(): BatchedPostException[] {
    const out: BatchedPostException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedPostExceptionStore(): BatchedPostExceptionStore {
  return new MemoryBatchedPostExceptionStore(new Map<string, BatchedPostException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedPostExceptionStore implements BatchedPostExceptionStore {
  inner: BatchedPostExceptionStore;
  cache: cache.TtlCache<BatchedPostException>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedPostExceptionStore,
    cacheValue: cache.TtlCache<BatchedPostException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedPostException | undefined {
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

  save(item: BatchedPostException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedPostException[] {
    return this.inner.list();
  }
}

export function newCachedBatchedPostExceptionStore(inner: BatchedPostExceptionStore, ttl: number, clockValue: clock.Clock): BatchedPostExceptionStore {
  return new CachedBatchedPostExceptionStore(
    inner,
    cache.newTtlCache<BatchedPostException>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched post exceptions. Empty fields match all. */
export class BatchedPostExceptionQuery {
  unit: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minCost: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedPostException): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedPostException[]): BatchedPostException[] {
    const matched = collections.filter(items, (candidate: BatchedPostException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedPostExceptions(store: BatchedPostExceptionStore, query: BatchedPostExceptionQuery): BatchedPostException[] {
  return query.apply(store.list());
}
