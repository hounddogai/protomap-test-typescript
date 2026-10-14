import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackApprovalQuota } from "./fallback-approval-quota.js";

/** Keeps fallback approval quotas by code. */
export interface FallbackApprovalQuotaStore {
  find(code: string): FallbackApprovalQuota | undefined;
  save(item: FallbackApprovalQuota): void;
  remove(code: string): boolean;
  list(): FallbackApprovalQuota[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackApprovalQuotaStore implements FallbackApprovalQuotaStore {
  items: Map<string, FallbackApprovalQuota>;
  order: string[];

  constructor(items: Map<string, FallbackApprovalQuota>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackApprovalQuota | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackApprovalQuota): void {
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

  list(): FallbackApprovalQuota[] {
    const out: FallbackApprovalQuota[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackApprovalQuotaStore(): FallbackApprovalQuotaStore {
  return new MemoryFallbackApprovalQuotaStore(new Map<string, FallbackApprovalQuota>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackApprovalQuotaStore implements FallbackApprovalQuotaStore {
  inner: FallbackApprovalQuotaStore;
  cache: cache.TtlCache<FallbackApprovalQuota>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackApprovalQuotaStore,
    cacheValue: cache.TtlCache<FallbackApprovalQuota>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackApprovalQuota | undefined {
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

  save(item: FallbackApprovalQuota): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackApprovalQuota[] {
    return this.inner.list();
  }
}

export function newCachedFallbackApprovalQuotaStore(inner: FallbackApprovalQuotaStore, ttl: number, clockValue: clock.Clock): FallbackApprovalQuotaStore {
  return new CachedFallbackApprovalQuotaStore(
    inner,
    cache.newTtlCache<FallbackApprovalQuota>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback approval quotas. Empty fields match all. */
export class FallbackApprovalQuotaQuery {
  name: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minRate: number, statuses: string[], limit: number) {
    this.name = name;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackApprovalQuota): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackApprovalQuota[]): FallbackApprovalQuota[] {
    const matched = collections.filter(items, (candidate: FallbackApprovalQuota): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackApprovalQuotas(store: FallbackApprovalQuotaStore, query: FallbackApprovalQuotaQuery): FallbackApprovalQuota[] {
  return query.apply(store.list());
}
