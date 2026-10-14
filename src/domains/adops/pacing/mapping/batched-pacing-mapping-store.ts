import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedPacingMapping } from "./batched-pacing-mapping.js";

/** Keeps batched pacing mappings by code. */
export interface BatchedPacingMappingStore {
  find(code: string): BatchedPacingMapping | undefined;
  save(item: BatchedPacingMapping): void;
  remove(code: string): boolean;
  list(): BatchedPacingMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedPacingMappingStore implements BatchedPacingMappingStore {
  items: Map<string, BatchedPacingMapping>;
  order: string[];

  constructor(items: Map<string, BatchedPacingMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedPacingMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedPacingMapping): void {
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

  list(): BatchedPacingMapping[] {
    const out: BatchedPacingMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedPacingMappingStore(): BatchedPacingMappingStore {
  return new MemoryBatchedPacingMappingStore(new Map<string, BatchedPacingMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedPacingMappingStore implements BatchedPacingMappingStore {
  inner: BatchedPacingMappingStore;
  cache: cache.TtlCache<BatchedPacingMapping>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedPacingMappingStore,
    cacheValue: cache.TtlCache<BatchedPacingMapping>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedPacingMapping | undefined {
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

  save(item: BatchedPacingMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedPacingMapping[] {
    return this.inner.list();
  }
}

export function newCachedBatchedPacingMappingStore(inner: BatchedPacingMappingStore, ttl: number, clockValue: clock.Clock): BatchedPacingMappingStore {
  return new CachedBatchedPacingMappingStore(
    inner,
    cache.newTtlCache<BatchedPacingMapping>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched pacing mappings. Empty fields match all. */
export class BatchedPacingMappingQuery {
  title: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minPriority: number, statuses: string[], limit: number) {
    this.title = title;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedPacingMapping): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedPacingMapping[]): BatchedPacingMapping[] {
    const matched = collections.filter(items, (candidate: BatchedPacingMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedPacingMappings(store: BatchedPacingMappingStore, query: BatchedPacingMappingQuery): BatchedPacingMapping[] {
  return query.apply(store.list());
}
