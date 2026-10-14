import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedPathMapping } from "./batched-path-mapping.js";

/** Keeps batched path mappings by code. */
export interface BatchedPathMappingStore {
  find(code: string): BatchedPathMapping | undefined;
  save(item: BatchedPathMapping): void;
  remove(code: string): boolean;
  list(): BatchedPathMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedPathMappingStore implements BatchedPathMappingStore {
  items: Map<string, BatchedPathMapping>;
  order: string[];

  constructor(items: Map<string, BatchedPathMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedPathMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedPathMapping): void {
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

  list(): BatchedPathMapping[] {
    const out: BatchedPathMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedPathMappingStore(): BatchedPathMappingStore {
  return new MemoryBatchedPathMappingStore(new Map<string, BatchedPathMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedPathMappingStore implements BatchedPathMappingStore {
  inner: BatchedPathMappingStore;
  cache: cache.TtlCache<BatchedPathMapping>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedPathMappingStore,
    cacheValue: cache.TtlCache<BatchedPathMapping>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedPathMapping | undefined {
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

  save(item: BatchedPathMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedPathMapping[] {
    return this.inner.list();
  }
}

export function newCachedBatchedPathMappingStore(inner: BatchedPathMappingStore, ttl: number, clockValue: clock.Clock): BatchedPathMappingStore {
  return new CachedBatchedPathMappingStore(inner, cache.newTtlCache<BatchedPathMapping>(512, ttl, clockValue), 0, 0);
}

/** Selects batched path mappings. Empty fields match all. */
export class BatchedPathMappingQuery {
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

  matches(item: BatchedPathMapping): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedPathMapping[]): BatchedPathMapping[] {
    const matched = collections.filter(items, (candidate: BatchedPathMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedPathMappings(store: BatchedPathMappingStore, query: BatchedPathMappingQuery): BatchedPathMapping[] {
  return query.apply(store.list());
}
