import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedConversionCycle } from "./batched-conversion-cycle.js";

/** Keeps batched conversion cycles by code. */
export interface BatchedConversionCycleStore {
  find(code: string): BatchedConversionCycle | undefined;
  save(item: BatchedConversionCycle): void;
  remove(code: string): boolean;
  list(): BatchedConversionCycle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedConversionCycleStore implements BatchedConversionCycleStore {
  items: Map<string, BatchedConversionCycle>;
  order: string[];

  constructor(items: Map<string, BatchedConversionCycle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedConversionCycle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedConversionCycle): void {
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

  list(): BatchedConversionCycle[] {
    const out: BatchedConversionCycle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedConversionCycleStore(): BatchedConversionCycleStore {
  return new MemoryBatchedConversionCycleStore(new Map<string, BatchedConversionCycle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedConversionCycleStore implements BatchedConversionCycleStore {
  inner: BatchedConversionCycleStore;
  cache: cache.TtlCache<BatchedConversionCycle>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedConversionCycleStore,
    cacheValue: cache.TtlCache<BatchedConversionCycle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedConversionCycle | undefined {
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

  save(item: BatchedConversionCycle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedConversionCycle[] {
    return this.inner.list();
  }
}

export function newCachedBatchedConversionCycleStore(inner: BatchedConversionCycleStore, ttl: number, clockValue: clock.Clock): BatchedConversionCycleStore {
  return new CachedBatchedConversionCycleStore(
    inner,
    cache.newTtlCache<BatchedConversionCycle>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched conversion cycles. Empty fields match all. */
export class BatchedConversionCycleQuery {
  country: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minCeiling: number, statuses: string[], limit: number) {
    this.country = country;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedConversionCycle): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedConversionCycle[]): BatchedConversionCycle[] {
    const matched = collections.filter(items, (candidate: BatchedConversionCycle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedConversionCycles(store: BatchedConversionCycleStore, query: BatchedConversionCycleQuery): BatchedConversionCycle[] {
  return query.apply(store.list());
}
