import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredQueueLedger } from "./tiered-queue-ledger.js";

/** Keeps tiered queue ledgers by code. */
export interface TieredQueueLedgerStore {
  find(code: string): TieredQueueLedger | undefined;
  save(item: TieredQueueLedger): void;
  remove(code: string): boolean;
  list(): TieredQueueLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredQueueLedgerStore implements TieredQueueLedgerStore {
  items: Map<string, TieredQueueLedger>;
  order: string[];

  constructor(items: Map<string, TieredQueueLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredQueueLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredQueueLedger): void {
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

  list(): TieredQueueLedger[] {
    const out: TieredQueueLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredQueueLedgerStore(): TieredQueueLedgerStore {
  return new MemoryTieredQueueLedgerStore(new Map<string, TieredQueueLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredQueueLedgerStore implements TieredQueueLedgerStore {
  inner: TieredQueueLedgerStore;
  cache: cache.TtlCache<TieredQueueLedger>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredQueueLedgerStore,
    cacheValue: cache.TtlCache<TieredQueueLedger>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredQueueLedger | undefined {
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

  save(item: TieredQueueLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredQueueLedger[] {
    return this.inner.list();
  }
}

export function newCachedTieredQueueLedgerStore(inner: TieredQueueLedgerStore, ttl: number, clockValue: clock.Clock): TieredQueueLedgerStore {
  return new CachedTieredQueueLedgerStore(inner, cache.newTtlCache<TieredQueueLedger>(64, ttl, clockValue), 0, 0);
}

/** Selects tiered queue ledgers. Empty fields match all. */
export class TieredQueueLedgerQuery {
  title: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minDiscount: number, statuses: string[], limit: number) {
    this.title = title;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredQueueLedger): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredQueueLedger[]): TieredQueueLedger[] {
    const matched = collections.filter(items, (candidate: TieredQueueLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredQueueLedgers(store: TieredQueueLedgerStore, query: TieredQueueLedgerQuery): TieredQueueLedger[] {
  return query.apply(store.list());
}
