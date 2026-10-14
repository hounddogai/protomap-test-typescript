import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptivePayoutQuota } from "./adaptive-payout-quota.js";

/** Keeps adaptive payout quotas by code. */
export interface AdaptivePayoutQuotaStore {
  find(code: string): AdaptivePayoutQuota | undefined;
  save(item: AdaptivePayoutQuota): void;
  remove(code: string): boolean;
  list(): AdaptivePayoutQuota[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptivePayoutQuotaStore implements AdaptivePayoutQuotaStore {
  items: Map<string, AdaptivePayoutQuota>;
  order: string[];

  constructor(items: Map<string, AdaptivePayoutQuota>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptivePayoutQuota | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptivePayoutQuota): void {
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

  list(): AdaptivePayoutQuota[] {
    const out: AdaptivePayoutQuota[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptivePayoutQuotaStore(): AdaptivePayoutQuotaStore {
  return new MemoryAdaptivePayoutQuotaStore(new Map<string, AdaptivePayoutQuota>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptivePayoutQuotaStore implements AdaptivePayoutQuotaStore {
  inner: AdaptivePayoutQuotaStore;
  cache: cache.TtlCache<AdaptivePayoutQuota>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptivePayoutQuotaStore,
    cacheValue: cache.TtlCache<AdaptivePayoutQuota>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptivePayoutQuota | undefined {
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

  save(item: AdaptivePayoutQuota): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptivePayoutQuota[] {
    return this.inner.list();
  }
}

export function newCachedAdaptivePayoutQuotaStore(inner: AdaptivePayoutQuotaStore, ttl: number, clockValue: clock.Clock): AdaptivePayoutQuotaStore {
  return new CachedAdaptivePayoutQuotaStore(inner, cache.newTtlCache<AdaptivePayoutQuota>(256, ttl, clockValue), 0, 0);
}

/** Selects adaptive payout quotas. Empty fields match all. */
export class AdaptivePayoutQuotaQuery {
  country: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minRatio: number, statuses: string[], limit: number) {
    this.country = country;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptivePayoutQuota): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptivePayoutQuota[]): AdaptivePayoutQuota[] {
    const matched = collections.filter(items, (candidate: AdaptivePayoutQuota): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptivePayoutQuotas(store: AdaptivePayoutQuotaStore, query: AdaptivePayoutQuotaQuery): AdaptivePayoutQuota[] {
  return query.apply(store.list());
}
