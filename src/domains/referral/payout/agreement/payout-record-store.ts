import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PayoutRecord } from "./payout-record.js";

/** Keeps payout records by code. */
export interface PayoutRecordStore {
  find(code: string): PayoutRecord | undefined;
  save(item: PayoutRecord): void;
  remove(code: string): boolean;
  list(): PayoutRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPayoutRecordStore implements PayoutRecordStore {
  items: Map<string, PayoutRecord>;
  order: string[];

  constructor(items: Map<string, PayoutRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PayoutRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PayoutRecord): void {
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

  list(): PayoutRecord[] {
    const out: PayoutRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPayoutRecordStore(): PayoutRecordStore {
  return new MemoryPayoutRecordStore(new Map<string, PayoutRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPayoutRecordStore implements PayoutRecordStore {
  inner: PayoutRecordStore;
  cache: cache.TtlCache<PayoutRecord>;
  hits: number;
  misses: number;

  constructor(inner: PayoutRecordStore, cacheValue: cache.TtlCache<PayoutRecord>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PayoutRecord | undefined {
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

  save(item: PayoutRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PayoutRecord[] {
    return this.inner.list();
  }
}

export function newCachedPayoutRecordStore(inner: PayoutRecordStore, ttl: number, clockValue: clock.Clock): PayoutRecordStore {
  return new CachedPayoutRecordStore(inner, cache.newTtlCache<PayoutRecord>(1024, ttl, clockValue), 0, 0);
}

/** Selects payout records. Empty fields match all. */
export class PayoutRecordQuery {
  category: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minBatchSize: number, statuses: string[], limit: number) {
    this.category = category;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PayoutRecord): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PayoutRecord[]): PayoutRecord[] {
    const matched = collections.filter(items, (candidate: PayoutRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPayoutRecords(store: PayoutRecordStore, query: PayoutRecordQuery): PayoutRecord[] {
  return query.apply(store.list());
}
