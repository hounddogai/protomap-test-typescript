import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BidRuleVariance } from "./bid-rule-variance.js";

/** Keeps bid rule variances by code. */
export interface BidRuleVarianceStore {
  find(code: string): BidRuleVariance | undefined;
  save(item: BidRuleVariance): void;
  remove(code: string): boolean;
  list(): BidRuleVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBidRuleVarianceStore implements BidRuleVarianceStore {
  items: Map<string, BidRuleVariance>;
  order: string[];

  constructor(items: Map<string, BidRuleVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BidRuleVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BidRuleVariance): void {
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

  list(): BidRuleVariance[] {
    const out: BidRuleVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBidRuleVarianceStore(): BidRuleVarianceStore {
  return new MemoryBidRuleVarianceStore(new Map<string, BidRuleVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBidRuleVarianceStore implements BidRuleVarianceStore {
  inner: BidRuleVarianceStore;
  cache: cache.TtlCache<BidRuleVariance>;
  hits: number;
  misses: number;

  constructor(
    inner: BidRuleVarianceStore,
    cacheValue: cache.TtlCache<BidRuleVariance>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BidRuleVariance | undefined {
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

  save(item: BidRuleVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BidRuleVariance[] {
    return this.inner.list();
  }
}

export function newCachedBidRuleVarianceStore(inner: BidRuleVarianceStore, ttl: number, clockValue: clock.Clock): BidRuleVarianceStore {
  return new CachedBidRuleVarianceStore(inner, cache.newTtlCache<BidRuleVariance>(256, ttl, clockValue), 0, 0);
}

/** Selects bid rule variances. Empty fields match all. */
export class BidRuleVarianceQuery {
  segment: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minAmount: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BidRuleVariance): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BidRuleVariance[]): BidRuleVariance[] {
    const matched = collections.filter(items, (candidate: BidRuleVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBidRuleVariances(store: BidRuleVarianceStore, query: BidRuleVarianceQuery): BidRuleVariance[] {
  return query.apply(store.list());
}
