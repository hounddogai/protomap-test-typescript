import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualBadgeQuota } from "./manual-badge-quota.js";

/** Keeps manual badge quotas by code. */
export interface ManualBadgeQuotaStore {
  find(code: string): ManualBadgeQuota | undefined;
  save(item: ManualBadgeQuota): void;
  remove(code: string): boolean;
  list(): ManualBadgeQuota[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualBadgeQuotaStore implements ManualBadgeQuotaStore {
  items: Map<string, ManualBadgeQuota>;
  order: string[];

  constructor(items: Map<string, ManualBadgeQuota>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualBadgeQuota | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualBadgeQuota): void {
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

  list(): ManualBadgeQuota[] {
    const out: ManualBadgeQuota[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualBadgeQuotaStore(): ManualBadgeQuotaStore {
  return new MemoryManualBadgeQuotaStore(new Map<string, ManualBadgeQuota>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualBadgeQuotaStore implements ManualBadgeQuotaStore {
  inner: ManualBadgeQuotaStore;
  cache: cache.TtlCache<ManualBadgeQuota>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualBadgeQuotaStore,
    cacheValue: cache.TtlCache<ManualBadgeQuota>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualBadgeQuota | undefined {
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

  save(item: ManualBadgeQuota): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualBadgeQuota[] {
    return this.inner.list();
  }
}

export function newCachedManualBadgeQuotaStore(inner: ManualBadgeQuotaStore, ttl: number, clockValue: clock.Clock): ManualBadgeQuotaStore {
  return new CachedManualBadgeQuotaStore(inner, cache.newTtlCache<ManualBadgeQuota>(128, ttl, clockValue), 0, 0);
}

/** Selects manual badge quotas. Empty fields match all. */
export class ManualBadgeQuotaQuery {
  segment: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minAmount: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualBadgeQuota): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualBadgeQuota[]): ManualBadgeQuota[] {
    const matched = collections.filter(items, (candidate: ManualBadgeQuota): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualBadgeQuotas(store: ManualBadgeQuotaStore, query: ManualBadgeQuotaQuery): ManualBadgeQuota[] {
  return query.apply(store.list());
}
