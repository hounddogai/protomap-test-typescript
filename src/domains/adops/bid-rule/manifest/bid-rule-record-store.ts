import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BidRuleRecord } from "./bid-rule-record.js";

/** Keeps bid rule records by code. */
export interface BidRuleRecordStore {
  find(code: string): BidRuleRecord | undefined;
  save(item: BidRuleRecord): void;
  remove(code: string): boolean;
  list(): BidRuleRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBidRuleRecordStore implements BidRuleRecordStore {
  items: Map<string, BidRuleRecord>;
  order: string[];

  constructor(items: Map<string, BidRuleRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BidRuleRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BidRuleRecord): void {
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

  list(): BidRuleRecord[] {
    const out: BidRuleRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBidRuleRecordStore(): BidRuleRecordStore {
  return new MemoryBidRuleRecordStore(new Map<string, BidRuleRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBidRuleRecordStore implements BidRuleRecordStore {
  inner: BidRuleRecordStore;
  cache: cache.TtlCache<BidRuleRecord>;
  hits: number;
  misses: number;

  constructor(inner: BidRuleRecordStore, cacheValue: cache.TtlCache<BidRuleRecord>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BidRuleRecord | undefined {
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

  save(item: BidRuleRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BidRuleRecord[] {
    return this.inner.list();
  }
}

export function newCachedBidRuleRecordStore(inner: BidRuleRecordStore, ttl: number, clockValue: clock.Clock): BidRuleRecordStore {
  return new CachedBidRuleRecordStore(inner, cache.newTtlCache<BidRuleRecord>(128, ttl, clockValue), 0, 0);
}

/** Selects bid rule records. Empty fields match all. */
export class BidRuleRecordQuery {
  source: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minWeight: number, statuses: string[], limit: number) {
    this.source = source;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BidRuleRecord): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BidRuleRecord[]): BidRuleRecord[] {
    const matched = collections.filter(items, (candidate: BidRuleRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBidRuleRecords(store: BidRuleRecordStore, query: BidRuleRecordQuery): BidRuleRecord[] {
  return query.apply(store.list());
}
