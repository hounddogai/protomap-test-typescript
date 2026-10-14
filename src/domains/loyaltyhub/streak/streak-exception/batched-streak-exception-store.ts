import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedStreakException } from "./batched-streak-exception.js";

/** Keeps batched streak exceptions by code. */
export interface BatchedStreakExceptionStore {
  find(code: string): BatchedStreakException | undefined;
  save(item: BatchedStreakException): void;
  remove(code: string): boolean;
  list(): BatchedStreakException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedStreakExceptionStore implements BatchedStreakExceptionStore {
  items: Map<string, BatchedStreakException>;
  order: string[];

  constructor(items: Map<string, BatchedStreakException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedStreakException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedStreakException): void {
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

  list(): BatchedStreakException[] {
    const out: BatchedStreakException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedStreakExceptionStore(): BatchedStreakExceptionStore {
  return new MemoryBatchedStreakExceptionStore(new Map<string, BatchedStreakException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedStreakExceptionStore implements BatchedStreakExceptionStore {
  inner: BatchedStreakExceptionStore;
  cache: cache.TtlCache<BatchedStreakException>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedStreakExceptionStore,
    cacheValue: cache.TtlCache<BatchedStreakException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedStreakException | undefined {
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

  save(item: BatchedStreakException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedStreakException[] {
    return this.inner.list();
  }
}

export function newCachedBatchedStreakExceptionStore(inner: BatchedStreakExceptionStore, ttl: number, clockValue: clock.Clock): BatchedStreakExceptionStore {
  return new CachedBatchedStreakExceptionStore(
    inner,
    cache.newTtlCache<BatchedStreakException>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched streak exceptions. Empty fields match all. */
export class BatchedStreakExceptionQuery {
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

  matches(item: BatchedStreakException): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedStreakException[]): BatchedStreakException[] {
    const matched = collections.filter(items, (candidate: BatchedStreakException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedStreakExceptions(store: BatchedStreakExceptionStore, query: BatchedStreakExceptionQuery): BatchedStreakException[] {
  return query.apply(store.list());
}
