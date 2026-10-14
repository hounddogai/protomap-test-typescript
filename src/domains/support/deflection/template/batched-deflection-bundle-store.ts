import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedDeflectionBundle } from "./batched-deflection-bundle.js";

/** Keeps batched deflection bundles by code. */
export interface BatchedDeflectionBundleStore {
  find(code: string): BatchedDeflectionBundle | undefined;
  save(item: BatchedDeflectionBundle): void;
  remove(code: string): boolean;
  list(): BatchedDeflectionBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedDeflectionBundleStore implements BatchedDeflectionBundleStore {
  items: Map<string, BatchedDeflectionBundle>;
  order: string[];

  constructor(items: Map<string, BatchedDeflectionBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedDeflectionBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedDeflectionBundle): void {
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

  list(): BatchedDeflectionBundle[] {
    const out: BatchedDeflectionBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedDeflectionBundleStore(): BatchedDeflectionBundleStore {
  return new MemoryBatchedDeflectionBundleStore(new Map<string, BatchedDeflectionBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedDeflectionBundleStore implements BatchedDeflectionBundleStore {
  inner: BatchedDeflectionBundleStore;
  cache: cache.TtlCache<BatchedDeflectionBundle>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedDeflectionBundleStore,
    cacheValue: cache.TtlCache<BatchedDeflectionBundle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedDeflectionBundle | undefined {
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

  save(item: BatchedDeflectionBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedDeflectionBundle[] {
    return this.inner.list();
  }
}

export function newCachedBatchedDeflectionBundleStore(inner: BatchedDeflectionBundleStore, ttl: number, clockValue: clock.Clock): BatchedDeflectionBundleStore {
  return new CachedBatchedDeflectionBundleStore(
    inner,
    cache.newTtlCache<BatchedDeflectionBundle>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched deflection bundles. Empty fields match all. */
export class BatchedDeflectionBundleQuery {
  label: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minBudget: number, statuses: string[], limit: number) {
    this.label = label;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedDeflectionBundle): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedDeflectionBundle[]): BatchedDeflectionBundle[] {
    const matched = collections.filter(items, (candidate: BatchedDeflectionBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedDeflectionBundles(store: BatchedDeflectionBundleStore, query: BatchedDeflectionBundleQuery): BatchedDeflectionBundle[] {
  return query.apply(store.list());
}
