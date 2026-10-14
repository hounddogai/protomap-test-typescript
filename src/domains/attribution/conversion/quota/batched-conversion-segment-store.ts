import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedConversionSegment } from "./batched-conversion-segment.js";

/** Keeps batched conversion segments by code. */
export interface BatchedConversionSegmentStore {
  find(code: string): BatchedConversionSegment | undefined;
  save(item: BatchedConversionSegment): void;
  remove(code: string): boolean;
  list(): BatchedConversionSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedConversionSegmentStore implements BatchedConversionSegmentStore {
  items: Map<string, BatchedConversionSegment>;
  order: string[];

  constructor(items: Map<string, BatchedConversionSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedConversionSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedConversionSegment): void {
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

  list(): BatchedConversionSegment[] {
    const out: BatchedConversionSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedConversionSegmentStore(): BatchedConversionSegmentStore {
  return new MemoryBatchedConversionSegmentStore(new Map<string, BatchedConversionSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedConversionSegmentStore implements BatchedConversionSegmentStore {
  inner: BatchedConversionSegmentStore;
  cache: cache.TtlCache<BatchedConversionSegment>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedConversionSegmentStore,
    cacheValue: cache.TtlCache<BatchedConversionSegment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedConversionSegment | undefined {
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

  save(item: BatchedConversionSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedConversionSegment[] {
    return this.inner.list();
  }
}

export function newCachedBatchedConversionSegmentStore(inner: BatchedConversionSegmentStore, ttl: number, clockValue: clock.Clock): BatchedConversionSegmentStore {
  return new CachedBatchedConversionSegmentStore(
    inner,
    cache.newTtlCache<BatchedConversionSegment>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched conversion segments. Empty fields match all. */
export class BatchedConversionSegmentQuery {
  country: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minRate: number, statuses: string[], limit: number) {
    this.country = country;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedConversionSegment): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedConversionSegment[]): BatchedConversionSegment[] {
    const matched = collections.filter(items, (candidate: BatchedConversionSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedConversionSegments(store: BatchedConversionSegmentStore, query: BatchedConversionSegmentQuery): BatchedConversionSegment[] {
  return query.apply(store.list());
}
