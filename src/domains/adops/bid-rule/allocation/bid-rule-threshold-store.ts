import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BidRuleThreshold } from "./bid-rule-threshold.js";

/** Keeps bid rule thresholds by code. */
export interface BidRuleThresholdStore {
  find(code: string): BidRuleThreshold | undefined;
  save(item: BidRuleThreshold): void;
  remove(code: string): boolean;
  list(): BidRuleThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBidRuleThresholdStore implements BidRuleThresholdStore {
  items: Map<string, BidRuleThreshold>;
  order: string[];

  constructor(items: Map<string, BidRuleThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BidRuleThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BidRuleThreshold): void {
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

  list(): BidRuleThreshold[] {
    const out: BidRuleThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBidRuleThresholdStore(): BidRuleThresholdStore {
  return new MemoryBidRuleThresholdStore(new Map<string, BidRuleThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBidRuleThresholdStore implements BidRuleThresholdStore {
  inner: BidRuleThresholdStore;
  cache: cache.TtlCache<BidRuleThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: BidRuleThresholdStore,
    cacheValue: cache.TtlCache<BidRuleThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BidRuleThreshold | undefined {
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

  save(item: BidRuleThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BidRuleThreshold[] {
    return this.inner.list();
  }
}

export function newCachedBidRuleThresholdStore(inner: BidRuleThresholdStore, ttl: number, clockValue: clock.Clock): BidRuleThresholdStore {
  return new CachedBidRuleThresholdStore(inner, cache.newTtlCache<BidRuleThreshold>(128, ttl, clockValue), 0, 0);
}

/** Selects bid rule thresholds. Empty fields match all. */
export class BidRuleThresholdQuery {
  category: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minRetries: number, statuses: string[], limit: number) {
    this.category = category;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BidRuleThreshold): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BidRuleThreshold[]): BidRuleThreshold[] {
    const matched = collections.filter(items, (candidate: BidRuleThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBidRuleThresholds(store: BidRuleThresholdStore, query: BidRuleThresholdQuery): BidRuleThreshold[] {
  return query.apply(store.list());
}
