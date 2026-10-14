import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BidRuleMetric } from "./bid-rule-metric.js";

/** Keeps bid rule metrics by code. */
export interface BidRuleMetricStore {
  find(code: string): BidRuleMetric | undefined;
  save(item: BidRuleMetric): void;
  remove(code: string): boolean;
  list(): BidRuleMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBidRuleMetricStore implements BidRuleMetricStore {
  items: Map<string, BidRuleMetric>;
  order: string[];

  constructor(items: Map<string, BidRuleMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BidRuleMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BidRuleMetric): void {
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

  list(): BidRuleMetric[] {
    const out: BidRuleMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBidRuleMetricStore(): BidRuleMetricStore {
  return new MemoryBidRuleMetricStore(new Map<string, BidRuleMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBidRuleMetricStore implements BidRuleMetricStore {
  inner: BidRuleMetricStore;
  cache: cache.TtlCache<BidRuleMetric>;
  hits: number;
  misses: number;

  constructor(inner: BidRuleMetricStore, cacheValue: cache.TtlCache<BidRuleMetric>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BidRuleMetric | undefined {
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

  save(item: BidRuleMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BidRuleMetric[] {
    return this.inner.list();
  }
}

export function newCachedBidRuleMetricStore(inner: BidRuleMetricStore, ttl: number, clockValue: clock.Clock): BidRuleMetricStore {
  return new CachedBidRuleMetricStore(inner, cache.newTtlCache<BidRuleMetric>(128, ttl, clockValue), 0, 0);
}

/** Selects bid rule metrics. Empty fields match all. */
export class BidRuleMetricQuery {
  name: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minQuantity: number, statuses: string[], limit: number) {
    this.name = name;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BidRuleMetric): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BidRuleMetric[]): BidRuleMetric[] {
    const matched = collections.filter(items, (candidate: BidRuleMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBidRuleMetrics(store: BidRuleMetricStore, query: BidRuleMetricQuery): BidRuleMetric[] {
  return query.apply(store.list());
}
