import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BidRuleLedger } from "./bid-rule-ledger.js";

/** Keeps bid rule ledgers by code. */
export interface BidRuleLedgerStore {
  find(code: string): BidRuleLedger | undefined;
  save(item: BidRuleLedger): void;
  remove(code: string): boolean;
  list(): BidRuleLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBidRuleLedgerStore implements BidRuleLedgerStore {
  items: Map<string, BidRuleLedger>;
  order: string[];

  constructor(items: Map<string, BidRuleLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BidRuleLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BidRuleLedger): void {
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

  list(): BidRuleLedger[] {
    const out: BidRuleLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBidRuleLedgerStore(): BidRuleLedgerStore {
  return new MemoryBidRuleLedgerStore(new Map<string, BidRuleLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBidRuleLedgerStore implements BidRuleLedgerStore {
  inner: BidRuleLedgerStore;
  cache: cache.TtlCache<BidRuleLedger>;
  hits: number;
  misses: number;

  constructor(inner: BidRuleLedgerStore, cacheValue: cache.TtlCache<BidRuleLedger>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BidRuleLedger | undefined {
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

  save(item: BidRuleLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BidRuleLedger[] {
    return this.inner.list();
  }
}

export function newCachedBidRuleLedgerStore(inner: BidRuleLedgerStore, ttl: number, clockValue: clock.Clock): BidRuleLedgerStore {
  return new CachedBidRuleLedgerStore(inner, cache.newTtlCache<BidRuleLedger>(128, ttl, clockValue), 0, 0);
}

/** Selects bid rule ledgers. Empty fields match all. */
export class BidRuleLedgerQuery {
  label: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minBatchSize: number, statuses: string[], limit: number) {
    this.label = label;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BidRuleLedger): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BidRuleLedger[]): BidRuleLedger[] {
    const matched = collections.filter(items, (candidate: BidRuleLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBidRuleLedgers(store: BidRuleLedgerStore, query: BidRuleLedgerQuery): BidRuleLedger[] {
  return query.apply(store.list());
}
