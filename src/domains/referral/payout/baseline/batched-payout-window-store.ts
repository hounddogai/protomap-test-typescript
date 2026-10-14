import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedPayoutWindow } from "./batched-payout-window.js";

/** Keeps batched payout windows by code. */
export interface BatchedPayoutWindowStore {
  find(code: string): BatchedPayoutWindow | undefined;
  save(item: BatchedPayoutWindow): void;
  remove(code: string): boolean;
  list(): BatchedPayoutWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedPayoutWindowStore implements BatchedPayoutWindowStore {
  items: Map<string, BatchedPayoutWindow>;
  order: string[];

  constructor(items: Map<string, BatchedPayoutWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedPayoutWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedPayoutWindow): void {
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

  list(): BatchedPayoutWindow[] {
    const out: BatchedPayoutWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedPayoutWindowStore(): BatchedPayoutWindowStore {
  return new MemoryBatchedPayoutWindowStore(new Map<string, BatchedPayoutWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedPayoutWindowStore implements BatchedPayoutWindowStore {
  inner: BatchedPayoutWindowStore;
  cache: cache.TtlCache<BatchedPayoutWindow>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedPayoutWindowStore,
    cacheValue: cache.TtlCache<BatchedPayoutWindow>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedPayoutWindow | undefined {
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

  save(item: BatchedPayoutWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedPayoutWindow[] {
    return this.inner.list();
  }
}

export function newCachedBatchedPayoutWindowStore(inner: BatchedPayoutWindowStore, ttl: number, clockValue: clock.Clock): BatchedPayoutWindowStore {
  return new CachedBatchedPayoutWindowStore(inner, cache.newTtlCache<BatchedPayoutWindow>(256, ttl, clockValue), 0, 0);
}

/** Selects batched payout windows. Empty fields match all. */
export class BatchedPayoutWindowQuery {
  region: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minDiscount: number, statuses: string[], limit: number) {
    this.region = region;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedPayoutWindow): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedPayoutWindow[]): BatchedPayoutWindow[] {
    const matched = collections.filter(items, (candidate: BatchedPayoutWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedPayoutWindows(store: BatchedPayoutWindowStore, query: BatchedPayoutWindowQuery): BatchedPayoutWindow[] {
  return query.apply(store.list());
}
