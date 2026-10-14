import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedBounceSlot } from "./batched-bounce-slot.js";

/** Keeps batched bounce slots by code. */
export interface BatchedBounceSlotStore {
  find(code: string): BatchedBounceSlot | undefined;
  save(item: BatchedBounceSlot): void;
  remove(code: string): boolean;
  list(): BatchedBounceSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedBounceSlotStore implements BatchedBounceSlotStore {
  items: Map<string, BatchedBounceSlot>;
  order: string[];

  constructor(items: Map<string, BatchedBounceSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedBounceSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedBounceSlot): void {
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

  list(): BatchedBounceSlot[] {
    const out: BatchedBounceSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedBounceSlotStore(): BatchedBounceSlotStore {
  return new MemoryBatchedBounceSlotStore(new Map<string, BatchedBounceSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedBounceSlotStore implements BatchedBounceSlotStore {
  inner: BatchedBounceSlotStore;
  cache: cache.TtlCache<BatchedBounceSlot>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedBounceSlotStore,
    cacheValue: cache.TtlCache<BatchedBounceSlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedBounceSlot | undefined {
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

  save(item: BatchedBounceSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedBounceSlot[] {
    return this.inner.list();
  }
}

export function newCachedBatchedBounceSlotStore(inner: BatchedBounceSlotStore, ttl: number, clockValue: clock.Clock): BatchedBounceSlotStore {
  return new CachedBatchedBounceSlotStore(inner, cache.newTtlCache<BatchedBounceSlot>(512, ttl, clockValue), 0, 0);
}

/** Selects batched bounce slots. Empty fields match all. */
export class BatchedBounceSlotQuery {
  source: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minQuantity: number, statuses: string[], limit: number) {
    this.source = source;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedBounceSlot): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedBounceSlot[]): BatchedBounceSlot[] {
    const matched = collections.filter(items, (candidate: BatchedBounceSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedBounceSlots(store: BatchedBounceSlotStore, query: BatchedBounceSlotQuery): BatchedBounceSlot[] {
  return query.apply(store.list());
}
