import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BidRuleAllocation } from "./bid-rule-allocation.js";

/** Keeps bid rule allocations by code. */
export interface BidRuleAllocationStore {
  find(code: string): BidRuleAllocation | undefined;
  save(item: BidRuleAllocation): void;
  remove(code: string): boolean;
  list(): BidRuleAllocation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBidRuleAllocationStore implements BidRuleAllocationStore {
  items: Map<string, BidRuleAllocation>;
  order: string[];

  constructor(items: Map<string, BidRuleAllocation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BidRuleAllocation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BidRuleAllocation): void {
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

  list(): BidRuleAllocation[] {
    const out: BidRuleAllocation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBidRuleAllocationStore(): BidRuleAllocationStore {
  return new MemoryBidRuleAllocationStore(new Map<string, BidRuleAllocation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBidRuleAllocationStore implements BidRuleAllocationStore {
  inner: BidRuleAllocationStore;
  cache: cache.TtlCache<BidRuleAllocation>;
  hits: number;
  misses: number;

  constructor(
    inner: BidRuleAllocationStore,
    cacheValue: cache.TtlCache<BidRuleAllocation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BidRuleAllocation | undefined {
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

  save(item: BidRuleAllocation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BidRuleAllocation[] {
    return this.inner.list();
  }
}

export function newCachedBidRuleAllocationStore(inner: BidRuleAllocationStore, ttl: number, clockValue: clock.Clock): BidRuleAllocationStore {
  return new CachedBidRuleAllocationStore(inner, cache.newTtlCache<BidRuleAllocation>(128, ttl, clockValue), 0, 0);
}

/** Selects bid rule allocations. Empty fields match all. */
export class BidRuleAllocationQuery {
  title: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minBudget: number, statuses: string[], limit: number) {
    this.title = title;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BidRuleAllocation): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BidRuleAllocation[]): BidRuleAllocation[] {
    const matched = collections.filter(items, (candidate: BidRuleAllocation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBidRuleAllocations(store: BidRuleAllocationStore, query: BidRuleAllocationQuery): BidRuleAllocation[] {
  return query.apply(store.list());
}
