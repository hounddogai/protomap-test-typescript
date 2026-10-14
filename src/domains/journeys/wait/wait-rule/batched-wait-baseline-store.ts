import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedWaitBaseline } from "./batched-wait-baseline.js";

/** Keeps batched wait baselines by code. */
export interface BatchedWaitBaselineStore {
  find(code: string): BatchedWaitBaseline | undefined;
  save(item: BatchedWaitBaseline): void;
  remove(code: string): boolean;
  list(): BatchedWaitBaseline[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedWaitBaselineStore implements BatchedWaitBaselineStore {
  items: Map<string, BatchedWaitBaseline>;
  order: string[];

  constructor(items: Map<string, BatchedWaitBaseline>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedWaitBaseline | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedWaitBaseline): void {
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

  list(): BatchedWaitBaseline[] {
    const out: BatchedWaitBaseline[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedWaitBaselineStore(): BatchedWaitBaselineStore {
  return new MemoryBatchedWaitBaselineStore(new Map<string, BatchedWaitBaseline>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedWaitBaselineStore implements BatchedWaitBaselineStore {
  inner: BatchedWaitBaselineStore;
  cache: cache.TtlCache<BatchedWaitBaseline>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedWaitBaselineStore,
    cacheValue: cache.TtlCache<BatchedWaitBaseline>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedWaitBaseline | undefined {
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

  save(item: BatchedWaitBaseline): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedWaitBaseline[] {
    return this.inner.list();
  }
}

export function newCachedBatchedWaitBaselineStore(inner: BatchedWaitBaselineStore, ttl: number, clockValue: clock.Clock): BatchedWaitBaselineStore {
  return new CachedBatchedWaitBaselineStore(inner, cache.newTtlCache<BatchedWaitBaseline>(512, ttl, clockValue), 0, 0);
}

/** Selects batched wait baselines. Empty fields match all. */
export class BatchedWaitBaselineQuery {
  source: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minQuantity: number, statuses: string[], limit: number) {
    this.source = source;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedWaitBaseline): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedWaitBaseline[]): BatchedWaitBaseline[] {
    const matched = collections.filter(items, (candidate: BatchedWaitBaseline): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedWaitBaselines(store: BatchedWaitBaselineStore, query: BatchedWaitBaselineQuery): BatchedWaitBaseline[] {
  return query.apply(store.list());
}
