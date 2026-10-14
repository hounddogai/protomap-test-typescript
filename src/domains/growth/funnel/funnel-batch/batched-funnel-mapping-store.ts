import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedFunnelMapping } from "./batched-funnel-mapping.js";

/** Keeps batched funnel mappings by code. */
export interface BatchedFunnelMappingStore {
  find(code: string): BatchedFunnelMapping | undefined;
  save(item: BatchedFunnelMapping): void;
  remove(code: string): boolean;
  list(): BatchedFunnelMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedFunnelMappingStore implements BatchedFunnelMappingStore {
  items: Map<string, BatchedFunnelMapping>;
  order: string[];

  constructor(items: Map<string, BatchedFunnelMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedFunnelMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedFunnelMapping): void {
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

  list(): BatchedFunnelMapping[] {
    const out: BatchedFunnelMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedFunnelMappingStore(): BatchedFunnelMappingStore {
  return new MemoryBatchedFunnelMappingStore(new Map<string, BatchedFunnelMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedFunnelMappingStore implements BatchedFunnelMappingStore {
  inner: BatchedFunnelMappingStore;
  cache: cache.TtlCache<BatchedFunnelMapping>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedFunnelMappingStore,
    cacheValue: cache.TtlCache<BatchedFunnelMapping>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedFunnelMapping | undefined {
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

  save(item: BatchedFunnelMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedFunnelMapping[] {
    return this.inner.list();
  }
}

export function newCachedBatchedFunnelMappingStore(inner: BatchedFunnelMappingStore, ttl: number, clockValue: clock.Clock): BatchedFunnelMappingStore {
  return new CachedBatchedFunnelMappingStore(
    inner,
    cache.newTtlCache<BatchedFunnelMapping>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched funnel mappings. Empty fields match all. */
export class BatchedFunnelMappingQuery {
  unit: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minRatio: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedFunnelMapping): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedFunnelMapping[]): BatchedFunnelMapping[] {
    const matched = collections.filter(items, (candidate: BatchedFunnelMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedFunnelMappings(store: BatchedFunnelMappingStore, query: BatchedFunnelMappingQuery): BatchedFunnelMapping[] {
  return query.apply(store.list());
}
