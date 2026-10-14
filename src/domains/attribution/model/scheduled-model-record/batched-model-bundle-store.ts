import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedModelBundle } from "./batched-model-bundle.js";

/** Keeps batched model bundles by code. */
export interface BatchedModelBundleStore {
  find(code: string): BatchedModelBundle | undefined;
  save(item: BatchedModelBundle): void;
  remove(code: string): boolean;
  list(): BatchedModelBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedModelBundleStore implements BatchedModelBundleStore {
  items: Map<string, BatchedModelBundle>;
  order: string[];

  constructor(items: Map<string, BatchedModelBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedModelBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedModelBundle): void {
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

  list(): BatchedModelBundle[] {
    const out: BatchedModelBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedModelBundleStore(): BatchedModelBundleStore {
  return new MemoryBatchedModelBundleStore(new Map<string, BatchedModelBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedModelBundleStore implements BatchedModelBundleStore {
  inner: BatchedModelBundleStore;
  cache: cache.TtlCache<BatchedModelBundle>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedModelBundleStore,
    cacheValue: cache.TtlCache<BatchedModelBundle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedModelBundle | undefined {
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

  save(item: BatchedModelBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedModelBundle[] {
    return this.inner.list();
  }
}

export function newCachedBatchedModelBundleStore(inner: BatchedModelBundleStore, ttl: number, clockValue: clock.Clock): BatchedModelBundleStore {
  return new CachedBatchedModelBundleStore(inner, cache.newTtlCache<BatchedModelBundle>(512, ttl, clockValue), 0, 0);
}

/** Selects batched model bundles. Empty fields match all. */
export class BatchedModelBundleQuery {
  channel: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minBudget: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedModelBundle): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedModelBundle[]): BatchedModelBundle[] {
    const matched = collections.filter(items, (candidate: BatchedModelBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedModelBundles(store: BatchedModelBundleStore, query: BatchedModelBundleQuery): BatchedModelBundle[] {
  return query.apply(store.list());
}
