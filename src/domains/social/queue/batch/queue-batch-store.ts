import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { QueueBatch } from "./queue-batch.js";

/** Keeps queue batches by code. */
export interface QueueBatchStore {
  find(code: string): QueueBatch | undefined;
  save(item: QueueBatch): void;
  remove(code: string): boolean;
  list(): QueueBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryQueueBatchStore implements QueueBatchStore {
  items: Map<string, QueueBatch>;
  order: string[];

  constructor(items: Map<string, QueueBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): QueueBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: QueueBatch): void {
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

  list(): QueueBatch[] {
    const out: QueueBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryQueueBatchStore(): QueueBatchStore {
  return new MemoryQueueBatchStore(new Map<string, QueueBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedQueueBatchStore implements QueueBatchStore {
  inner: QueueBatchStore;
  cache: cache.TtlCache<QueueBatch>;
  hits: number;
  misses: number;

  constructor(inner: QueueBatchStore, cacheValue: cache.TtlCache<QueueBatch>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): QueueBatch | undefined {
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

  save(item: QueueBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): QueueBatch[] {
    return this.inner.list();
  }
}

export function newCachedQueueBatchStore(inner: QueueBatchStore, ttl: number, clockValue: clock.Clock): QueueBatchStore {
  return new CachedQueueBatchStore(inner, cache.newTtlCache<QueueBatch>(128, ttl, clockValue), 0, 0);
}

/** Selects queue batches. Empty fields match all. */
export class QueueBatchQuery {
  source: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minBid: number, statuses: string[], limit: number) {
    this.source = source;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: QueueBatch): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: QueueBatch[]): QueueBatch[] {
    const matched = collections.filter(items, (candidate: QueueBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findQueueBatches(store: QueueBatchStore, query: QueueBatchQuery): QueueBatch[] {
  return query.apply(store.list());
}
