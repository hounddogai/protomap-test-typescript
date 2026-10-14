import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedRetentionSegment } from "./batched-retention-segment.js";

/** Keeps batched retention segments by code. */
export interface BatchedRetentionSegmentStore {
  find(code: string): BatchedRetentionSegment | undefined;
  save(item: BatchedRetentionSegment): void;
  remove(code: string): boolean;
  list(): BatchedRetentionSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedRetentionSegmentStore implements BatchedRetentionSegmentStore {
  items: Map<string, BatchedRetentionSegment>;
  order: string[];

  constructor(items: Map<string, BatchedRetentionSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedRetentionSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedRetentionSegment): void {
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

  list(): BatchedRetentionSegment[] {
    const out: BatchedRetentionSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedRetentionSegmentStore(): BatchedRetentionSegmentStore {
  return new MemoryBatchedRetentionSegmentStore(new Map<string, BatchedRetentionSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedRetentionSegmentStore implements BatchedRetentionSegmentStore {
  inner: BatchedRetentionSegmentStore;
  cache: cache.TtlCache<BatchedRetentionSegment>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedRetentionSegmentStore,
    cacheValue: cache.TtlCache<BatchedRetentionSegment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedRetentionSegment | undefined {
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

  save(item: BatchedRetentionSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedRetentionSegment[] {
    return this.inner.list();
  }
}

export function newCachedBatchedRetentionSegmentStore(inner: BatchedRetentionSegmentStore, ttl: number, clockValue: clock.Clock): BatchedRetentionSegmentStore {
  return new CachedBatchedRetentionSegmentStore(
    inner,
    cache.newTtlCache<BatchedRetentionSegment>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched retention segments. Empty fields match all. */
export class BatchedRetentionSegmentQuery {
  category: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minMargin: number, statuses: string[], limit: number) {
    this.category = category;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedRetentionSegment): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedRetentionSegment[]): BatchedRetentionSegment[] {
    const matched = collections.filter(items, (candidate: BatchedRetentionSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedRetentionSegments(store: BatchedRetentionSegmentStore, query: BatchedRetentionSegmentQuery): BatchedRetentionSegment[] {
  return query.apply(store.list());
}
