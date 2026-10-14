import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedProofCycle } from "./batched-proof-cycle.js";

/** Keeps batched proof cycles by code. */
export interface BatchedProofCycleStore {
  find(code: string): BatchedProofCycle | undefined;
  save(item: BatchedProofCycle): void;
  remove(code: string): boolean;
  list(): BatchedProofCycle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedProofCycleStore implements BatchedProofCycleStore {
  items: Map<string, BatchedProofCycle>;
  order: string[];

  constructor(items: Map<string, BatchedProofCycle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedProofCycle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedProofCycle): void {
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

  list(): BatchedProofCycle[] {
    const out: BatchedProofCycle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedProofCycleStore(): BatchedProofCycleStore {
  return new MemoryBatchedProofCycleStore(new Map<string, BatchedProofCycle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedProofCycleStore implements BatchedProofCycleStore {
  inner: BatchedProofCycleStore;
  cache: cache.TtlCache<BatchedProofCycle>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedProofCycleStore,
    cacheValue: cache.TtlCache<BatchedProofCycle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedProofCycle | undefined {
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

  save(item: BatchedProofCycle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedProofCycle[] {
    return this.inner.list();
  }
}

export function newCachedBatchedProofCycleStore(inner: BatchedProofCycleStore, ttl: number, clockValue: clock.Clock): BatchedProofCycleStore {
  return new CachedBatchedProofCycleStore(inner, cache.newTtlCache<BatchedProofCycle>(64, ttl, clockValue), 0, 0);
}

/** Selects batched proof cycles. Empty fields match all. */
export class BatchedProofCycleQuery {
  locale: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minAmount: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedProofCycle): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedProofCycle[]): BatchedProofCycle[] {
    const matched = collections.filter(items, (candidate: BatchedProofCycle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedProofCycles(store: BatchedProofCycleStore, query: BatchedProofCycleQuery): BatchedProofCycle[] {
  return query.apply(store.list());
}
