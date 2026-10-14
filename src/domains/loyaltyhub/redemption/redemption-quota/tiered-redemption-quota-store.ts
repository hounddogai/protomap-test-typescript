import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredRedemptionQuota } from "./tiered-redemption-quota.js";

/** Keeps tiered redemption quotas by code. */
export interface TieredRedemptionQuotaStore {
  find(code: string): TieredRedemptionQuota | undefined;
  save(item: TieredRedemptionQuota): void;
  remove(code: string): boolean;
  list(): TieredRedemptionQuota[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredRedemptionQuotaStore implements TieredRedemptionQuotaStore {
  items: Map<string, TieredRedemptionQuota>;
  order: string[];

  constructor(items: Map<string, TieredRedemptionQuota>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredRedemptionQuota | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredRedemptionQuota): void {
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

  list(): TieredRedemptionQuota[] {
    const out: TieredRedemptionQuota[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredRedemptionQuotaStore(): TieredRedemptionQuotaStore {
  return new MemoryTieredRedemptionQuotaStore(new Map<string, TieredRedemptionQuota>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredRedemptionQuotaStore implements TieredRedemptionQuotaStore {
  inner: TieredRedemptionQuotaStore;
  cache: cache.TtlCache<TieredRedemptionQuota>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredRedemptionQuotaStore,
    cacheValue: cache.TtlCache<TieredRedemptionQuota>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredRedemptionQuota | undefined {
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

  save(item: TieredRedemptionQuota): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredRedemptionQuota[] {
    return this.inner.list();
  }
}

export function newCachedTieredRedemptionQuotaStore(inner: TieredRedemptionQuotaStore, ttl: number, clockValue: clock.Clock): TieredRedemptionQuotaStore {
  return new CachedTieredRedemptionQuotaStore(
    inner,
    cache.newTtlCache<TieredRedemptionQuota>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered redemption quotas. Empty fields match all. */
export class TieredRedemptionQuotaQuery {
  source: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minThreshold: number, statuses: string[], limit: number) {
    this.source = source;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredRedemptionQuota): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredRedemptionQuota[]): TieredRedemptionQuota[] {
    const matched = collections.filter(items, (candidate: TieredRedemptionQuota): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredRedemptionQuotas(store: TieredRedemptionQuotaStore, query: TieredRedemptionQuotaQuery): TieredRedemptionQuota[] {
  return query.apply(store.list());
}
