import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BidRuleBundle } from "./bid-rule-bundle.js";

/** Keeps bid rule bundles by code. */
export interface BidRuleBundleStore {
  find(code: string): BidRuleBundle | undefined;
  save(item: BidRuleBundle): void;
  remove(code: string): boolean;
  list(): BidRuleBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBidRuleBundleStore implements BidRuleBundleStore {
  items: Map<string, BidRuleBundle>;
  order: string[];

  constructor(items: Map<string, BidRuleBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BidRuleBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BidRuleBundle): void {
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

  list(): BidRuleBundle[] {
    const out: BidRuleBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBidRuleBundleStore(): BidRuleBundleStore {
  return new MemoryBidRuleBundleStore(new Map<string, BidRuleBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBidRuleBundleStore implements BidRuleBundleStore {
  inner: BidRuleBundleStore;
  cache: cache.TtlCache<BidRuleBundle>;
  hits: number;
  misses: number;

  constructor(inner: BidRuleBundleStore, cacheValue: cache.TtlCache<BidRuleBundle>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BidRuleBundle | undefined {
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

  save(item: BidRuleBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BidRuleBundle[] {
    return this.inner.list();
  }
}

export function newCachedBidRuleBundleStore(inner: BidRuleBundleStore, ttl: number, clockValue: clock.Clock): BidRuleBundleStore {
  return new CachedBidRuleBundleStore(inner, cache.newTtlCache<BidRuleBundle>(128, ttl, clockValue), 0, 0);
}

/** Selects bid rule bundles. Empty fields match all. */
export class BidRuleBundleQuery {
  label: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minScore: number, statuses: string[], limit: number) {
    this.label = label;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BidRuleBundle): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BidRuleBundle[]): BidRuleBundle[] {
    const matched = collections.filter(items, (candidate: BidRuleBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBidRuleBundles(store: BidRuleBundleStore, query: BidRuleBundleQuery): BidRuleBundle[] {
  return query.apply(store.list());
}
