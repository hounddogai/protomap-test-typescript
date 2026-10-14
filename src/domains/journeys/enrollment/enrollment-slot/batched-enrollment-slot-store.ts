import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedEnrollmentSlot } from "./batched-enrollment-slot.js";

/** Keeps batched enrollment slots by code. */
export interface BatchedEnrollmentSlotStore {
  find(code: string): BatchedEnrollmentSlot | undefined;
  save(item: BatchedEnrollmentSlot): void;
  remove(code: string): boolean;
  list(): BatchedEnrollmentSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedEnrollmentSlotStore implements BatchedEnrollmentSlotStore {
  items: Map<string, BatchedEnrollmentSlot>;
  order: string[];

  constructor(items: Map<string, BatchedEnrollmentSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedEnrollmentSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedEnrollmentSlot): void {
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

  list(): BatchedEnrollmentSlot[] {
    const out: BatchedEnrollmentSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedEnrollmentSlotStore(): BatchedEnrollmentSlotStore {
  return new MemoryBatchedEnrollmentSlotStore(new Map<string, BatchedEnrollmentSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedEnrollmentSlotStore implements BatchedEnrollmentSlotStore {
  inner: BatchedEnrollmentSlotStore;
  cache: cache.TtlCache<BatchedEnrollmentSlot>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedEnrollmentSlotStore,
    cacheValue: cache.TtlCache<BatchedEnrollmentSlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedEnrollmentSlot | undefined {
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

  save(item: BatchedEnrollmentSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedEnrollmentSlot[] {
    return this.inner.list();
  }
}

export function newCachedBatchedEnrollmentSlotStore(inner: BatchedEnrollmentSlotStore, ttl: number, clockValue: clock.Clock): BatchedEnrollmentSlotStore {
  return new CachedBatchedEnrollmentSlotStore(
    inner,
    cache.newTtlCache<BatchedEnrollmentSlot>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched enrollment slots. Empty fields match all. */
export class BatchedEnrollmentSlotQuery {
  locale: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minAmount: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedEnrollmentSlot): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedEnrollmentSlot[]): BatchedEnrollmentSlot[] {
    const matched = collections.filter(items, (candidate: BatchedEnrollmentSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedEnrollmentSlots(store: BatchedEnrollmentSlotStore, query: BatchedEnrollmentSlotQuery): BatchedEnrollmentSlot[] {
  return query.apply(store.list());
}
