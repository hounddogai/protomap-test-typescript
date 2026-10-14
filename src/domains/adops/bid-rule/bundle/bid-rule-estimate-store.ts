import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BidRuleEstimate } from "./bid-rule-estimate.js";

/** Keeps bid rule estimates by code. */
export interface BidRuleEstimateStore {
  find(code: string): BidRuleEstimate | undefined;
  save(item: BidRuleEstimate): void;
  remove(code: string): boolean;
  list(): BidRuleEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBidRuleEstimateStore implements BidRuleEstimateStore {
  items: Map<string, BidRuleEstimate>;
  order: string[];

  constructor(items: Map<string, BidRuleEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BidRuleEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BidRuleEstimate): void {
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

  list(): BidRuleEstimate[] {
    const out: BidRuleEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBidRuleEstimateStore(): BidRuleEstimateStore {
  return new MemoryBidRuleEstimateStore(new Map<string, BidRuleEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBidRuleEstimateStore implements BidRuleEstimateStore {
  inner: BidRuleEstimateStore;
  cache: cache.TtlCache<BidRuleEstimate>;
  hits: number;
  misses: number;

  constructor(
    inner: BidRuleEstimateStore,
    cacheValue: cache.TtlCache<BidRuleEstimate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BidRuleEstimate | undefined {
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

  save(item: BidRuleEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BidRuleEstimate[] {
    return this.inner.list();
  }
}

export function newCachedBidRuleEstimateStore(inner: BidRuleEstimateStore, ttl: number, clockValue: clock.Clock): BidRuleEstimateStore {
  return new CachedBidRuleEstimateStore(inner, cache.newTtlCache<BidRuleEstimate>(1024, ttl, clockValue), 0, 0);
}

/** Selects bid rule estimates. Empty fields match all. */
export class BidRuleEstimateQuery {
  name: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minConversionRate: number, statuses: string[], limit: number) {
    this.name = name;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BidRuleEstimate): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BidRuleEstimate[]): BidRuleEstimate[] {
    const matched = collections.filter(items, (candidate: BidRuleEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBidRuleEstimates(store: BidRuleEstimateStore, query: BidRuleEstimateQuery): BidRuleEstimate[] {
  return query.apply(store.list());
}
