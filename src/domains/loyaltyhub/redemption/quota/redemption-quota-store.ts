import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RedemptionQuota } from "./redemption-quota.js";

/** Keeps redemption quotas by code. */
export interface RedemptionQuotaStore {
  find(code: string): RedemptionQuota | undefined;
  save(item: RedemptionQuota): void;
  remove(code: string): boolean;
  list(): RedemptionQuota[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRedemptionQuotaStore implements RedemptionQuotaStore {
  items: Map<string, RedemptionQuota>;
  order: string[];

  constructor(items: Map<string, RedemptionQuota>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RedemptionQuota | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RedemptionQuota): void {
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

  list(): RedemptionQuota[] {
    const out: RedemptionQuota[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRedemptionQuotaStore(): RedemptionQuotaStore {
  return new MemoryRedemptionQuotaStore(new Map<string, RedemptionQuota>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRedemptionQuotaStore implements RedemptionQuotaStore {
  inner: RedemptionQuotaStore;
  cache: cache.TtlCache<RedemptionQuota>;
  hits: number;
  misses: number;

  constructor(
    inner: RedemptionQuotaStore,
    cacheValue: cache.TtlCache<RedemptionQuota>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RedemptionQuota | undefined {
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

  save(item: RedemptionQuota): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RedemptionQuota[] {
    return this.inner.list();
  }
}

export function newCachedRedemptionQuotaStore(inner: RedemptionQuotaStore, ttl: number, clockValue: clock.Clock): RedemptionQuotaStore {
  return new CachedRedemptionQuotaStore(inner, cache.newTtlCache<RedemptionQuota>(64, ttl, clockValue), 0, 0);
}

/** Selects redemption quotas. Empty fields match all. */
export class RedemptionQuotaQuery {
  title: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minMargin: number, statuses: string[], limit: number) {
    this.title = title;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RedemptionQuota): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RedemptionQuota[]): RedemptionQuota[] {
    const matched = collections.filter(items, (candidate: RedemptionQuota): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRedemptionQuotas(store: RedemptionQuotaStore, query: RedemptionQuotaQuery): RedemptionQuota[] {
  return query.apply(store.list());
}
