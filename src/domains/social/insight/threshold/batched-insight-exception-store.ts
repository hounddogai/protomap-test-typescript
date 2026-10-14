import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedInsightException } from "./batched-insight-exception.js";

/** Keeps batched insight exceptions by code. */
export interface BatchedInsightExceptionStore {
  find(code: string): BatchedInsightException | undefined;
  save(item: BatchedInsightException): void;
  remove(code: string): boolean;
  list(): BatchedInsightException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedInsightExceptionStore implements BatchedInsightExceptionStore {
  items: Map<string, BatchedInsightException>;
  order: string[];

  constructor(items: Map<string, BatchedInsightException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedInsightException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedInsightException): void {
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

  list(): BatchedInsightException[] {
    const out: BatchedInsightException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedInsightExceptionStore(): BatchedInsightExceptionStore {
  return new MemoryBatchedInsightExceptionStore(new Map<string, BatchedInsightException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedInsightExceptionStore implements BatchedInsightExceptionStore {
  inner: BatchedInsightExceptionStore;
  cache: cache.TtlCache<BatchedInsightException>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedInsightExceptionStore,
    cacheValue: cache.TtlCache<BatchedInsightException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedInsightException | undefined {
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

  save(item: BatchedInsightException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedInsightException[] {
    return this.inner.list();
  }
}

export function newCachedBatchedInsightExceptionStore(inner: BatchedInsightExceptionStore, ttl: number, clockValue: clock.Clock): BatchedInsightExceptionStore {
  return new CachedBatchedInsightExceptionStore(
    inner,
    cache.newTtlCache<BatchedInsightException>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched insight exceptions. Empty fields match all. */
export class BatchedInsightExceptionQuery {
  locale: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minPriority: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedInsightException): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedInsightException[]): BatchedInsightException[] {
    const matched = collections.filter(items, (candidate: BatchedInsightException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedInsightExceptions(store: BatchedInsightExceptionStore, query: BatchedInsightExceptionQuery): BatchedInsightException[] {
  return query.apply(store.list());
}
