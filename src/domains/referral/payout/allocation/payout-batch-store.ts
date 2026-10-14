import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PayoutBatch } from "./payout-batch.js";

/** Keeps payout batches by code. */
export interface PayoutBatchStore {
  find(code: string): PayoutBatch | undefined;
  save(item: PayoutBatch): void;
  remove(code: string): boolean;
  list(): PayoutBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPayoutBatchStore implements PayoutBatchStore {
  items: Map<string, PayoutBatch>;
  order: string[];

  constructor(items: Map<string, PayoutBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PayoutBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PayoutBatch): void {
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

  list(): PayoutBatch[] {
    const out: PayoutBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPayoutBatchStore(): PayoutBatchStore {
  return new MemoryPayoutBatchStore(new Map<string, PayoutBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPayoutBatchStore implements PayoutBatchStore {
  inner: PayoutBatchStore;
  cache: cache.TtlCache<PayoutBatch>;
  hits: number;
  misses: number;

  constructor(inner: PayoutBatchStore, cacheValue: cache.TtlCache<PayoutBatch>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PayoutBatch | undefined {
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

  save(item: PayoutBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PayoutBatch[] {
    return this.inner.list();
  }
}

export function newCachedPayoutBatchStore(inner: PayoutBatchStore, ttl: number, clockValue: clock.Clock): PayoutBatchStore {
  return new CachedPayoutBatchStore(inner, cache.newTtlCache<PayoutBatch>(256, ttl, clockValue), 0, 0);
}

/** Selects payout batches. Empty fields match all. */
export class PayoutBatchQuery {
  locale: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minMargin: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PayoutBatch): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PayoutBatch[]): PayoutBatch[] {
    const matched = collections.filter(items, (candidate: PayoutBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPayoutBatches(store: PayoutBatchStore, query: PayoutBatchQuery): PayoutBatch[] {
  return query.apply(store.list());
}
