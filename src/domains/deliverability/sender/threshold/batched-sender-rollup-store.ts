import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedSenderRollup } from "./batched-sender-rollup.js";

/** Keeps batched sender rollups by code. */
export interface BatchedSenderRollupStore {
  find(code: string): BatchedSenderRollup | undefined;
  save(item: BatchedSenderRollup): void;
  remove(code: string): boolean;
  list(): BatchedSenderRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedSenderRollupStore implements BatchedSenderRollupStore {
  items: Map<string, BatchedSenderRollup>;
  order: string[];

  constructor(items: Map<string, BatchedSenderRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedSenderRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedSenderRollup): void {
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

  list(): BatchedSenderRollup[] {
    const out: BatchedSenderRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedSenderRollupStore(): BatchedSenderRollupStore {
  return new MemoryBatchedSenderRollupStore(new Map<string, BatchedSenderRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedSenderRollupStore implements BatchedSenderRollupStore {
  inner: BatchedSenderRollupStore;
  cache: cache.TtlCache<BatchedSenderRollup>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedSenderRollupStore,
    cacheValue: cache.TtlCache<BatchedSenderRollup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedSenderRollup | undefined {
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

  save(item: BatchedSenderRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedSenderRollup[] {
    return this.inner.list();
  }
}

export function newCachedBatchedSenderRollupStore(inner: BatchedSenderRollupStore, ttl: number, clockValue: clock.Clock): BatchedSenderRollupStore {
  return new CachedBatchedSenderRollupStore(inner, cache.newTtlCache<BatchedSenderRollup>(64, ttl, clockValue), 0, 0);
}

/** Selects batched sender rollups. Empty fields match all. */
export class BatchedSenderRollupQuery {
  locale: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minCeiling: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedSenderRollup): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedSenderRollup[]): BatchedSenderRollup[] {
    const matched = collections.filter(items, (candidate: BatchedSenderRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedSenderRollups(store: BatchedSenderRollupStore, query: BatchedSenderRollupQuery): BatchedSenderRollup[] {
  return query.apply(store.list());
}
