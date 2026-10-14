import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FunnelQuota } from "./funnel-quota.js";

/** Keeps funnel quotas by code. */
export interface FunnelQuotaStore {
  find(code: string): FunnelQuota | undefined;
  save(item: FunnelQuota): void;
  remove(code: string): boolean;
  list(): FunnelQuota[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFunnelQuotaStore implements FunnelQuotaStore {
  items: Map<string, FunnelQuota>;
  order: string[];

  constructor(items: Map<string, FunnelQuota>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FunnelQuota | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FunnelQuota): void {
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

  list(): FunnelQuota[] {
    const out: FunnelQuota[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFunnelQuotaStore(): FunnelQuotaStore {
  return new MemoryFunnelQuotaStore(new Map<string, FunnelQuota>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFunnelQuotaStore implements FunnelQuotaStore {
  inner: FunnelQuotaStore;
  cache: cache.TtlCache<FunnelQuota>;
  hits: number;
  misses: number;

  constructor(inner: FunnelQuotaStore, cacheValue: cache.TtlCache<FunnelQuota>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FunnelQuota | undefined {
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

  save(item: FunnelQuota): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FunnelQuota[] {
    return this.inner.list();
  }
}

export function newCachedFunnelQuotaStore(inner: FunnelQuotaStore, ttl: number, clockValue: clock.Clock): FunnelQuotaStore {
  return new CachedFunnelQuotaStore(inner, cache.newTtlCache<FunnelQuota>(256, ttl, clockValue), 0, 0);
}

/** Selects funnel quotas. Empty fields match all. */
export class FunnelQuotaQuery {
  label: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minAmount: number, statuses: string[], limit: number) {
    this.label = label;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FunnelQuota): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FunnelQuota[]): FunnelQuota[] {
    const matched = collections.filter(items, (candidate: FunnelQuota): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFunnelQuotas(store: FunnelQuotaStore, query: FunnelQuotaQuery): FunnelQuota[] {
  return query.apply(store.list());
}
