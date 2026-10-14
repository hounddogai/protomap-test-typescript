import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BidRuleItem } from "./bid-rule-item.js";

/** Keeps bid rule items by code. */
export interface BidRuleItemStore {
  find(code: string): BidRuleItem | undefined;
  save(item: BidRuleItem): void;
  remove(code: string): boolean;
  list(): BidRuleItem[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBidRuleItemStore implements BidRuleItemStore {
  items: Map<string, BidRuleItem>;
  order: string[];

  constructor(items: Map<string, BidRuleItem>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BidRuleItem | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BidRuleItem): void {
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

  list(): BidRuleItem[] {
    const out: BidRuleItem[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBidRuleItemStore(): BidRuleItemStore {
  return new MemoryBidRuleItemStore(new Map<string, BidRuleItem>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBidRuleItemStore implements BidRuleItemStore {
  inner: BidRuleItemStore;
  cache: cache.TtlCache<BidRuleItem>;
  hits: number;
  misses: number;

  constructor(inner: BidRuleItemStore, cacheValue: cache.TtlCache<BidRuleItem>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BidRuleItem | undefined {
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

  save(item: BidRuleItem): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BidRuleItem[] {
    return this.inner.list();
  }
}

export function newCachedBidRuleItemStore(inner: BidRuleItemStore, ttl: number, clockValue: clock.Clock): BidRuleItemStore {
  return new CachedBidRuleItemStore(inner, cache.newTtlCache<BidRuleItem>(128, ttl, clockValue), 0, 0);
}

/** Selects bid rule items. Empty fields match all. */
export class BidRuleItemQuery {
  title: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minBid: number, statuses: string[], limit: number) {
    this.title = title;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BidRuleItem): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BidRuleItem[]): BidRuleItem[] {
    const matched = collections.filter(items, (candidate: BidRuleItem): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBidRuleItems(store: BidRuleItemStore, query: BidRuleItemQuery): BidRuleItem[] {
  return query.apply(store.list());
}
