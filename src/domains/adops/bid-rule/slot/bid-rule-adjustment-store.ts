import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BidRuleAdjustment } from "./bid-rule-adjustment.js";

/** Keeps bid rule adjustments by code. */
export interface BidRuleAdjustmentStore {
  find(code: string): BidRuleAdjustment | undefined;
  save(item: BidRuleAdjustment): void;
  remove(code: string): boolean;
  list(): BidRuleAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBidRuleAdjustmentStore implements BidRuleAdjustmentStore {
  items: Map<string, BidRuleAdjustment>;
  order: string[];

  constructor(items: Map<string, BidRuleAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BidRuleAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BidRuleAdjustment): void {
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

  list(): BidRuleAdjustment[] {
    const out: BidRuleAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBidRuleAdjustmentStore(): BidRuleAdjustmentStore {
  return new MemoryBidRuleAdjustmentStore(new Map<string, BidRuleAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBidRuleAdjustmentStore implements BidRuleAdjustmentStore {
  inner: BidRuleAdjustmentStore;
  cache: cache.TtlCache<BidRuleAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: BidRuleAdjustmentStore,
    cacheValue: cache.TtlCache<BidRuleAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BidRuleAdjustment | undefined {
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

  save(item: BidRuleAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BidRuleAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedBidRuleAdjustmentStore(inner: BidRuleAdjustmentStore, ttl: number, clockValue: clock.Clock): BidRuleAdjustmentStore {
  return new CachedBidRuleAdjustmentStore(inner, cache.newTtlCache<BidRuleAdjustment>(512, ttl, clockValue), 0, 0);
}

/** Selects bid rule adjustments. Empty fields match all. */
export class BidRuleAdjustmentQuery {
  category: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.category = category;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BidRuleAdjustment): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BidRuleAdjustment[]): BidRuleAdjustment[] {
    const matched = collections.filter(items, (candidate: BidRuleAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBidRuleAdjustments(store: BidRuleAdjustmentStore, query: BidRuleAdjustmentQuery): BidRuleAdjustment[] {
  return query.apply(store.list());
}
