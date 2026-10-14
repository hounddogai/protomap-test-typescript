import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackPathBatch } from "./fallback-path-batch.js";

/** Keeps fallback path batches by code. */
export interface FallbackPathBatchStore {
  find(code: string): FallbackPathBatch | undefined;
  save(item: FallbackPathBatch): void;
  remove(code: string): boolean;
  list(): FallbackPathBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackPathBatchStore implements FallbackPathBatchStore {
  items: Map<string, FallbackPathBatch>;
  order: string[];

  constructor(items: Map<string, FallbackPathBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackPathBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackPathBatch): void {
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

  list(): FallbackPathBatch[] {
    const out: FallbackPathBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackPathBatchStore(): FallbackPathBatchStore {
  return new MemoryFallbackPathBatchStore(new Map<string, FallbackPathBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackPathBatchStore implements FallbackPathBatchStore {
  inner: FallbackPathBatchStore;
  cache: cache.TtlCache<FallbackPathBatch>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackPathBatchStore,
    cacheValue: cache.TtlCache<FallbackPathBatch>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackPathBatch | undefined {
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

  save(item: FallbackPathBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackPathBatch[] {
    return this.inner.list();
  }
}

export function newCachedFallbackPathBatchStore(inner: FallbackPathBatchStore, ttl: number, clockValue: clock.Clock): FallbackPathBatchStore {
  return new CachedFallbackPathBatchStore(inner, cache.newTtlCache<FallbackPathBatch>(128, ttl, clockValue), 0, 0);
}

/** Selects fallback path batches. Empty fields match all. */
export class FallbackPathBatchQuery {
  label: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minWindowDays: number, statuses: string[], limit: number) {
    this.label = label;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackPathBatch): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackPathBatch[]): FallbackPathBatch[] {
    const matched = collections.filter(items, (candidate: FallbackPathBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackPathBatches(store: FallbackPathBatchStore, query: FallbackPathBatchQuery): FallbackPathBatch[] {
  return query.apply(store.list());
}
