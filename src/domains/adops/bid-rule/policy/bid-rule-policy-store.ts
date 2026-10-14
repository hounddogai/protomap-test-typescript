import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BidRulePolicy } from "./bid-rule-policy.js";

/** Keeps bid rule policies by code. */
export interface BidRulePolicyStore {
  find(code: string): BidRulePolicy | undefined;
  save(item: BidRulePolicy): void;
  remove(code: string): boolean;
  list(): BidRulePolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBidRulePolicyStore implements BidRulePolicyStore {
  items: Map<string, BidRulePolicy>;
  order: string[];

  constructor(items: Map<string, BidRulePolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BidRulePolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BidRulePolicy): void {
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

  list(): BidRulePolicy[] {
    const out: BidRulePolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBidRulePolicyStore(): BidRulePolicyStore {
  return new MemoryBidRulePolicyStore(new Map<string, BidRulePolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBidRulePolicyStore implements BidRulePolicyStore {
  inner: BidRulePolicyStore;
  cache: cache.TtlCache<BidRulePolicy>;
  hits: number;
  misses: number;

  constructor(inner: BidRulePolicyStore, cacheValue: cache.TtlCache<BidRulePolicy>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BidRulePolicy | undefined {
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

  save(item: BidRulePolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BidRulePolicy[] {
    return this.inner.list();
  }
}

export function newCachedBidRulePolicyStore(inner: BidRulePolicyStore, ttl: number, clockValue: clock.Clock): BidRulePolicyStore {
  return new CachedBidRulePolicyStore(inner, cache.newTtlCache<BidRulePolicy>(1024, ttl, clockValue), 0, 0);
}

/** Selects bid rule policies. Empty fields match all. */
export class BidRulePolicyQuery {
  category: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minSendAt: number, statuses: string[], limit: number) {
    this.category = category;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BidRulePolicy): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BidRulePolicy[]): BidRulePolicy[] {
    const matched = collections.filter(items, (candidate: BidRulePolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBidRulePolicies(store: BidRulePolicyStore, query: BidRulePolicyQuery): BidRulePolicy[] {
  return query.apply(store.list());
}
