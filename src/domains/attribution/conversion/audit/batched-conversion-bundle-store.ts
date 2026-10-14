import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedConversionBundle } from "./batched-conversion-bundle.js";

/** Keeps batched conversion bundles by code. */
export interface BatchedConversionBundleStore {
  find(code: string): BatchedConversionBundle | undefined;
  save(item: BatchedConversionBundle): void;
  remove(code: string): boolean;
  list(): BatchedConversionBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedConversionBundleStore implements BatchedConversionBundleStore {
  items: Map<string, BatchedConversionBundle>;
  order: string[];

  constructor(items: Map<string, BatchedConversionBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedConversionBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedConversionBundle): void {
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

  list(): BatchedConversionBundle[] {
    const out: BatchedConversionBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedConversionBundleStore(): BatchedConversionBundleStore {
  return new MemoryBatchedConversionBundleStore(new Map<string, BatchedConversionBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedConversionBundleStore implements BatchedConversionBundleStore {
  inner: BatchedConversionBundleStore;
  cache: cache.TtlCache<BatchedConversionBundle>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedConversionBundleStore,
    cacheValue: cache.TtlCache<BatchedConversionBundle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedConversionBundle | undefined {
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

  save(item: BatchedConversionBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedConversionBundle[] {
    return this.inner.list();
  }
}

export function newCachedBatchedConversionBundleStore(inner: BatchedConversionBundleStore, ttl: number, clockValue: clock.Clock): BatchedConversionBundleStore {
  return new CachedBatchedConversionBundleStore(
    inner,
    cache.newTtlCache<BatchedConversionBundle>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched conversion bundles. Empty fields match all. */
export class BatchedConversionBundleQuery {
  label: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minThreshold: number, statuses: string[], limit: number) {
    this.label = label;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedConversionBundle): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedConversionBundle[]): BatchedConversionBundle[] {
    const matched = collections.filter(items, (candidate: BatchedConversionBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedConversionBundles(store: BatchedConversionBundleStore, query: BatchedConversionBundleQuery): BatchedConversionBundle[] {
  return query.apply(store.list());
}
