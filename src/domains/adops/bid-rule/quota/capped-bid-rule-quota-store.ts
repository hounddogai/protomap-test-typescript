import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedBidRuleQuota } from "./capped-bid-rule-quota.js";

/** Keeps capped bid rule quotas by code. */
export interface CappedBidRuleQuotaStore {
  find(code: string): CappedBidRuleQuota | undefined;
  save(item: CappedBidRuleQuota): void;
  remove(code: string): boolean;
  list(): CappedBidRuleQuota[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedBidRuleQuotaStore implements CappedBidRuleQuotaStore {
  items: Map<string, CappedBidRuleQuota>;
  order: string[];

  constructor(items: Map<string, CappedBidRuleQuota>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedBidRuleQuota | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedBidRuleQuota): void {
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

  list(): CappedBidRuleQuota[] {
    const out: CappedBidRuleQuota[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedBidRuleQuotaStore(): CappedBidRuleQuotaStore {
  return new MemoryCappedBidRuleQuotaStore(new Map<string, CappedBidRuleQuota>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedBidRuleQuotaStore implements CappedBidRuleQuotaStore {
  inner: CappedBidRuleQuotaStore;
  cache: cache.TtlCache<CappedBidRuleQuota>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedBidRuleQuotaStore,
    cacheValue: cache.TtlCache<CappedBidRuleQuota>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedBidRuleQuota | undefined {
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

  save(item: CappedBidRuleQuota): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedBidRuleQuota[] {
    return this.inner.list();
  }
}

export function newCachedCappedBidRuleQuotaStore(inner: CappedBidRuleQuotaStore, ttl: number, clockValue: clock.Clock): CappedBidRuleQuotaStore {
  return new CachedCappedBidRuleQuotaStore(inner, cache.newTtlCache<CappedBidRuleQuota>(512, ttl, clockValue), 0, 0);
}

/** Selects capped bid rule quotas. Empty fields match all. */
export class CappedBidRuleQuotaQuery {
  title: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minGraceDays: number, statuses: string[], limit: number) {
    this.title = title;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedBidRuleQuota): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedBidRuleQuota[]): CappedBidRuleQuota[] {
    const matched = collections.filter(items, (candidate: CappedBidRuleQuota): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedBidRuleQuotas(store: CappedBidRuleQuotaStore, query: CappedBidRuleQuotaQuery): CappedBidRuleQuota[] {
  return query.apply(store.list());
}
