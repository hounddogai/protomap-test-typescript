import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PayoutQuota } from "./payout-quota.js";

/** Keeps payout quotas by code. */
export interface PayoutQuotaStore {
  find(code: string): PayoutQuota | undefined;
  save(item: PayoutQuota): void;
  remove(code: string): boolean;
  list(): PayoutQuota[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPayoutQuotaStore implements PayoutQuotaStore {
  items: Map<string, PayoutQuota>;
  order: string[];

  constructor(items: Map<string, PayoutQuota>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PayoutQuota | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PayoutQuota): void {
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

  list(): PayoutQuota[] {
    const out: PayoutQuota[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPayoutQuotaStore(): PayoutQuotaStore {
  return new MemoryPayoutQuotaStore(new Map<string, PayoutQuota>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPayoutQuotaStore implements PayoutQuotaStore {
  inner: PayoutQuotaStore;
  cache: cache.TtlCache<PayoutQuota>;
  hits: number;
  misses: number;

  constructor(inner: PayoutQuotaStore, cacheValue: cache.TtlCache<PayoutQuota>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PayoutQuota | undefined {
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

  save(item: PayoutQuota): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PayoutQuota[] {
    return this.inner.list();
  }
}

export function newCachedPayoutQuotaStore(inner: PayoutQuotaStore, ttl: number, clockValue: clock.Clock): PayoutQuotaStore {
  return new CachedPayoutQuotaStore(inner, cache.newTtlCache<PayoutQuota>(256, ttl, clockValue), 0, 0);
}

/** Selects payout quotas. Empty fields match all. */
export class PayoutQuotaQuery {
  region: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minFloorValue: number, statuses: string[], limit: number) {
    this.region = region;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PayoutQuota): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PayoutQuota[]): PayoutQuota[] {
    const matched = collections.filter(items, (candidate: PayoutQuota): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPayoutQuotas(store: PayoutQuotaStore, query: PayoutQuotaQuery): PayoutQuota[] {
  return query.apply(store.list());
}
