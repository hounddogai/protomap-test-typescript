import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualBidRuleEstimate } from "./manual-bid-rule-estimate.js";

/** Keeps manual bid rule estimates by code. */
export interface ManualBidRuleEstimateStore {
  find(code: string): ManualBidRuleEstimate | undefined;
  save(item: ManualBidRuleEstimate): void;
  remove(code: string): boolean;
  list(): ManualBidRuleEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualBidRuleEstimateStore implements ManualBidRuleEstimateStore {
  items: Map<string, ManualBidRuleEstimate>;
  order: string[];

  constructor(items: Map<string, ManualBidRuleEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualBidRuleEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualBidRuleEstimate): void {
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

  list(): ManualBidRuleEstimate[] {
    const out: ManualBidRuleEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualBidRuleEstimateStore(): ManualBidRuleEstimateStore {
  return new MemoryManualBidRuleEstimateStore(new Map<string, ManualBidRuleEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualBidRuleEstimateStore implements ManualBidRuleEstimateStore {
  inner: ManualBidRuleEstimateStore;
  cache: cache.TtlCache<ManualBidRuleEstimate>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualBidRuleEstimateStore,
    cacheValue: cache.TtlCache<ManualBidRuleEstimate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualBidRuleEstimate | undefined {
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

  save(item: ManualBidRuleEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualBidRuleEstimate[] {
    return this.inner.list();
  }
}

export function newCachedManualBidRuleEstimateStore(inner: ManualBidRuleEstimateStore, ttl: number, clockValue: clock.Clock): ManualBidRuleEstimateStore {
  return new CachedManualBidRuleEstimateStore(
    inner,
    cache.newTtlCache<ManualBidRuleEstimate>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects manual bid rule estimates. Empty fields match all. */
export class ManualBidRuleEstimateQuery {
  title: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minOpenRate: number, statuses: string[], limit: number) {
    this.title = title;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualBidRuleEstimate): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualBidRuleEstimate[]): ManualBidRuleEstimate[] {
    const matched = collections.filter(items, (candidate: ManualBidRuleEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualBidRuleEstimates(store: ManualBidRuleEstimateStore, query: ManualBidRuleEstimateQuery): ManualBidRuleEstimate[] {
  return query.apply(store.list());
}
