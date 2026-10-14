import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BidRuleQuota } from "./bid-rule-quota.js";

/** Keeps bid rule quotas by code. */
export interface BidRuleQuotaStore {
  find(code: string): BidRuleQuota | undefined;
  save(item: BidRuleQuota): void;
  remove(code: string): boolean;
  list(): BidRuleQuota[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBidRuleQuotaStore implements BidRuleQuotaStore {
  items: Map<string, BidRuleQuota>;
  order: string[];

  constructor(items: Map<string, BidRuleQuota>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BidRuleQuota | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BidRuleQuota): void {
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

  list(): BidRuleQuota[] {
    const out: BidRuleQuota[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBidRuleQuotaStore(): BidRuleQuotaStore {
  return new MemoryBidRuleQuotaStore(new Map<string, BidRuleQuota>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBidRuleQuotaStore implements BidRuleQuotaStore {
  inner: BidRuleQuotaStore;
  cache: cache.TtlCache<BidRuleQuota>;
  hits: number;
  misses: number;

  constructor(inner: BidRuleQuotaStore, cacheValue: cache.TtlCache<BidRuleQuota>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BidRuleQuota | undefined {
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

  save(item: BidRuleQuota): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BidRuleQuota[] {
    return this.inner.list();
  }
}

export function newCachedBidRuleQuotaStore(inner: BidRuleQuotaStore, ttl: number, clockValue: clock.Clock): BidRuleQuotaStore {
  return new CachedBidRuleQuotaStore(inner, cache.newTtlCache<BidRuleQuota>(256, ttl, clockValue), 0, 0);
}

/** Selects bid rule quotas. Empty fields match all. */
export class BidRuleQuotaQuery {
  title: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minAttempts: number, statuses: string[], limit: number) {
    this.title = title;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BidRuleQuota): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BidRuleQuota[]): BidRuleQuota[] {
    const matched = collections.filter(items, (candidate: BidRuleQuota): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBidRuleQuotas(store: BidRuleQuotaStore, query: BidRuleQuotaQuery): BidRuleQuota[] {
  return query.apply(store.list());
}
