import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedInviteBatch } from "./batched-invite-batch.js";

/** Keeps batched invite batches by code. */
export interface BatchedInviteBatchStore {
  find(code: string): BatchedInviteBatch | undefined;
  save(item: BatchedInviteBatch): void;
  remove(code: string): boolean;
  list(): BatchedInviteBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedInviteBatchStore implements BatchedInviteBatchStore {
  items: Map<string, BatchedInviteBatch>;
  order: string[];

  constructor(items: Map<string, BatchedInviteBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedInviteBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedInviteBatch): void {
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

  list(): BatchedInviteBatch[] {
    const out: BatchedInviteBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedInviteBatchStore(): BatchedInviteBatchStore {
  return new MemoryBatchedInviteBatchStore(new Map<string, BatchedInviteBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedInviteBatchStore implements BatchedInviteBatchStore {
  inner: BatchedInviteBatchStore;
  cache: cache.TtlCache<BatchedInviteBatch>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedInviteBatchStore,
    cacheValue: cache.TtlCache<BatchedInviteBatch>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedInviteBatch | undefined {
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

  save(item: BatchedInviteBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedInviteBatch[] {
    return this.inner.list();
  }
}

export function newCachedBatchedInviteBatchStore(inner: BatchedInviteBatchStore, ttl: number, clockValue: clock.Clock): BatchedInviteBatchStore {
  return new CachedBatchedInviteBatchStore(inner, cache.newTtlCache<BatchedInviteBatch>(1024, ttl, clockValue), 0, 0);
}

/** Selects batched invite batches. Empty fields match all. */
export class BatchedInviteBatchQuery {
  channel: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minCost: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedInviteBatch): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedInviteBatch[]): BatchedInviteBatch[] {
    const matched = collections.filter(items, (candidate: BatchedInviteBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedInviteBatches(store: BatchedInviteBatchStore, query: BatchedInviteBatchQuery): BatchedInviteBatch[] {
  return query.apply(store.list());
}
