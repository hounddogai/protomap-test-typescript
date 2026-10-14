import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedMacroSlot } from "./batched-macro-slot.js";

/** Keeps batched macro slots by code. */
export interface BatchedMacroSlotStore {
  find(code: string): BatchedMacroSlot | undefined;
  save(item: BatchedMacroSlot): void;
  remove(code: string): boolean;
  list(): BatchedMacroSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedMacroSlotStore implements BatchedMacroSlotStore {
  items: Map<string, BatchedMacroSlot>;
  order: string[];

  constructor(items: Map<string, BatchedMacroSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedMacroSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedMacroSlot): void {
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

  list(): BatchedMacroSlot[] {
    const out: BatchedMacroSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedMacroSlotStore(): BatchedMacroSlotStore {
  return new MemoryBatchedMacroSlotStore(new Map<string, BatchedMacroSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedMacroSlotStore implements BatchedMacroSlotStore {
  inner: BatchedMacroSlotStore;
  cache: cache.TtlCache<BatchedMacroSlot>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedMacroSlotStore,
    cacheValue: cache.TtlCache<BatchedMacroSlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedMacroSlot | undefined {
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

  save(item: BatchedMacroSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedMacroSlot[] {
    return this.inner.list();
  }
}

export function newCachedBatchedMacroSlotStore(inner: BatchedMacroSlotStore, ttl: number, clockValue: clock.Clock): BatchedMacroSlotStore {
  return new CachedBatchedMacroSlotStore(inner, cache.newTtlCache<BatchedMacroSlot>(256, ttl, clockValue), 0, 0);
}

/** Selects batched macro slots. Empty fields match all. */
export class BatchedMacroSlotQuery {
  source: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minThreshold: number, statuses: string[], limit: number) {
    this.source = source;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedMacroSlot): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedMacroSlot[]): BatchedMacroSlot[] {
    const matched = collections.filter(items, (candidate: BatchedMacroSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedMacroSlots(store: BatchedMacroSlotStore, query: BatchedMacroSlotQuery): BatchedMacroSlot[] {
  return query.apply(store.list());
}
