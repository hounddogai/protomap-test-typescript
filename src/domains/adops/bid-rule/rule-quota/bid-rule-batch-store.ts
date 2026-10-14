import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BidRuleBatch } from "./bid-rule-batch.js";

/** Keeps bid rule batches by code. */
export interface BidRuleBatchStore {
  find(code: string): BidRuleBatch | undefined;
  save(item: BidRuleBatch): void;
  remove(code: string): boolean;
  list(): BidRuleBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBidRuleBatchStore implements BidRuleBatchStore {
  items: Map<string, BidRuleBatch>;
  order: string[];

  constructor(items: Map<string, BidRuleBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BidRuleBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BidRuleBatch): void {
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

  list(): BidRuleBatch[] {
    const out: BidRuleBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBidRuleBatchStore(): BidRuleBatchStore {
  return new MemoryBidRuleBatchStore(new Map<string, BidRuleBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBidRuleBatchStore implements BidRuleBatchStore {
  inner: BidRuleBatchStore;
  cache: cache.TtlCache<BidRuleBatch>;
  hits: number;
  misses: number;

  constructor(inner: BidRuleBatchStore, cacheValue: cache.TtlCache<BidRuleBatch>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BidRuleBatch | undefined {
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

  save(item: BidRuleBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BidRuleBatch[] {
    return this.inner.list();
  }
}

export function newCachedBidRuleBatchStore(inner: BidRuleBatchStore, ttl: number, clockValue: clock.Clock): BidRuleBatchStore {
  return new CachedBidRuleBatchStore(inner, cache.newTtlCache<BidRuleBatch>(512, ttl, clockValue), 0, 0);
}

/** Selects bid rule batches. Empty fields match all. */
export class BidRuleBatchQuery {
  label: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minBid: number, statuses: string[], limit: number) {
    this.label = label;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BidRuleBatch): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BidRuleBatch[]): BidRuleBatch[] {
    const matched = collections.filter(items, (candidate: BidRuleBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBidRuleBatches(store: BidRuleBatchStore, query: BidRuleBatchQuery): BidRuleBatch[] {
  return query.apply(store.list());
}
