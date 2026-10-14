import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedPlacementRollup } from "./batched-placement-rollup.js";

/** Keeps batched placement rollups by code. */
export interface BatchedPlacementRollupStore {
  find(code: string): BatchedPlacementRollup | undefined;
  save(item: BatchedPlacementRollup): void;
  remove(code: string): boolean;
  list(): BatchedPlacementRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedPlacementRollupStore implements BatchedPlacementRollupStore {
  items: Map<string, BatchedPlacementRollup>;
  order: string[];

  constructor(items: Map<string, BatchedPlacementRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedPlacementRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedPlacementRollup): void {
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

  list(): BatchedPlacementRollup[] {
    const out: BatchedPlacementRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedPlacementRollupStore(): BatchedPlacementRollupStore {
  return new MemoryBatchedPlacementRollupStore(new Map<string, BatchedPlacementRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedPlacementRollupStore implements BatchedPlacementRollupStore {
  inner: BatchedPlacementRollupStore;
  cache: cache.TtlCache<BatchedPlacementRollup>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedPlacementRollupStore,
    cacheValue: cache.TtlCache<BatchedPlacementRollup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedPlacementRollup | undefined {
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

  save(item: BatchedPlacementRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedPlacementRollup[] {
    return this.inner.list();
  }
}

export function newCachedBatchedPlacementRollupStore(inner: BatchedPlacementRollupStore, ttl: number, clockValue: clock.Clock): BatchedPlacementRollupStore {
  return new CachedBatchedPlacementRollupStore(
    inner,
    cache.newTtlCache<BatchedPlacementRollup>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched placement rollups. Empty fields match all. */
export class BatchedPlacementRollupQuery {
  locale: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minRetries: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedPlacementRollup): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedPlacementRollup[]): BatchedPlacementRollup[] {
    const matched = collections.filter(items, (candidate: BatchedPlacementRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedPlacementRollups(store: BatchedPlacementRollupStore, query: BatchedPlacementRollupQuery): BatchedPlacementRollup[] {
  return query.apply(store.list());
}
