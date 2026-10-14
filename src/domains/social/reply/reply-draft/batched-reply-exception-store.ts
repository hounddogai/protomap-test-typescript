import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedReplyException } from "./batched-reply-exception.js";

/** Keeps batched reply exceptions by code. */
export interface BatchedReplyExceptionStore {
  find(code: string): BatchedReplyException | undefined;
  save(item: BatchedReplyException): void;
  remove(code: string): boolean;
  list(): BatchedReplyException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedReplyExceptionStore implements BatchedReplyExceptionStore {
  items: Map<string, BatchedReplyException>;
  order: string[];

  constructor(items: Map<string, BatchedReplyException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedReplyException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedReplyException): void {
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

  list(): BatchedReplyException[] {
    const out: BatchedReplyException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedReplyExceptionStore(): BatchedReplyExceptionStore {
  return new MemoryBatchedReplyExceptionStore(new Map<string, BatchedReplyException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedReplyExceptionStore implements BatchedReplyExceptionStore {
  inner: BatchedReplyExceptionStore;
  cache: cache.TtlCache<BatchedReplyException>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedReplyExceptionStore,
    cacheValue: cache.TtlCache<BatchedReplyException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedReplyException | undefined {
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

  save(item: BatchedReplyException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedReplyException[] {
    return this.inner.list();
  }
}

export function newCachedBatchedReplyExceptionStore(inner: BatchedReplyExceptionStore, ttl: number, clockValue: clock.Clock): BatchedReplyExceptionStore {
  return new CachedBatchedReplyExceptionStore(
    inner,
    cache.newTtlCache<BatchedReplyException>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched reply exceptions. Empty fields match all. */
export class BatchedReplyExceptionQuery {
  channel: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minBatchSize: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedReplyException): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedReplyException[]): BatchedReplyException[] {
    const matched = collections.filter(items, (candidate: BatchedReplyException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedReplyExceptions(store: BatchedReplyExceptionStore, query: BatchedReplyExceptionQuery): BatchedReplyException[] {
  return query.apply(store.list());
}
