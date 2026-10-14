import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualBidRuleClaim } from "./manual-bid-rule-claim.js";

/** Keeps manual bid rule claims by code. */
export interface ManualBidRuleClaimStore {
  find(code: string): ManualBidRuleClaim | undefined;
  save(item: ManualBidRuleClaim): void;
  remove(code: string): boolean;
  list(): ManualBidRuleClaim[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualBidRuleClaimStore implements ManualBidRuleClaimStore {
  items: Map<string, ManualBidRuleClaim>;
  order: string[];

  constructor(items: Map<string, ManualBidRuleClaim>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualBidRuleClaim | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualBidRuleClaim): void {
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

  list(): ManualBidRuleClaim[] {
    const out: ManualBidRuleClaim[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualBidRuleClaimStore(): ManualBidRuleClaimStore {
  return new MemoryManualBidRuleClaimStore(new Map<string, ManualBidRuleClaim>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualBidRuleClaimStore implements ManualBidRuleClaimStore {
  inner: ManualBidRuleClaimStore;
  cache: cache.TtlCache<ManualBidRuleClaim>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualBidRuleClaimStore,
    cacheValue: cache.TtlCache<ManualBidRuleClaim>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualBidRuleClaim | undefined {
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

  save(item: ManualBidRuleClaim): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualBidRuleClaim[] {
    return this.inner.list();
  }
}

export function newCachedManualBidRuleClaimStore(inner: ManualBidRuleClaimStore, ttl: number, clockValue: clock.Clock): ManualBidRuleClaimStore {
  return new CachedManualBidRuleClaimStore(inner, cache.newTtlCache<ManualBidRuleClaim>(128, ttl, clockValue), 0, 0);
}

/** Selects manual bid rule claims. Empty fields match all. */
export class ManualBidRuleClaimQuery {
  locale: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minImpressions: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualBidRuleClaim): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualBidRuleClaim[]): ManualBidRuleClaim[] {
    const matched = collections.filter(items, (candidate: ManualBidRuleClaim): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualBidRuleClaims(store: ManualBidRuleClaimStore, query: ManualBidRuleClaimQuery): ManualBidRuleClaim[] {
  return query.apply(store.list());
}
