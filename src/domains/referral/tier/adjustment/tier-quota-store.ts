import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TierQuota } from "./tier-quota.js";

/** Keeps tier quotas by code. */
export interface TierQuotaStore {
  find(code: string): TierQuota | undefined;
  save(item: TierQuota): void;
  remove(code: string): boolean;
  list(): TierQuota[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTierQuotaStore implements TierQuotaStore {
  items: Map<string, TierQuota>;
  order: string[];

  constructor(items: Map<string, TierQuota>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TierQuota | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TierQuota): void {
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

  list(): TierQuota[] {
    const out: TierQuota[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTierQuotaStore(): TierQuotaStore {
  return new MemoryTierQuotaStore(new Map<string, TierQuota>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTierQuotaStore implements TierQuotaStore {
  inner: TierQuotaStore;
  cache: cache.TtlCache<TierQuota>;
  hits: number;
  misses: number;

  constructor(inner: TierQuotaStore, cacheValue: cache.TtlCache<TierQuota>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TierQuota | undefined {
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

  save(item: TierQuota): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TierQuota[] {
    return this.inner.list();
  }
}

export function newCachedTierQuotaStore(inner: TierQuotaStore, ttl: number, clockValue: clock.Clock): TierQuotaStore {
  return new CachedTierQuotaStore(inner, cache.newTtlCache<TierQuota>(64, ttl, clockValue), 0, 0);
}

/** Selects tier quotas. Empty fields match all. */
export class TierQuotaQuery {
  region: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minEndsAt: number, statuses: string[], limit: number) {
    this.region = region;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TierQuota): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TierQuota[]): TierQuota[] {
    const matched = collections.filter(items, (candidate: TierQuota): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTierQuotas(store: TierQuotaStore, query: TierQuotaQuery): TierQuota[] {
  return query.apply(store.list());
}
