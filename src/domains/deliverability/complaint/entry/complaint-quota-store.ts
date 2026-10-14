import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ComplaintQuota } from "./complaint-quota.js";

/** Keeps complaint quotas by code. */
export interface ComplaintQuotaStore {
  find(code: string): ComplaintQuota | undefined;
  save(item: ComplaintQuota): void;
  remove(code: string): boolean;
  list(): ComplaintQuota[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryComplaintQuotaStore implements ComplaintQuotaStore {
  items: Map<string, ComplaintQuota>;
  order: string[];

  constructor(items: Map<string, ComplaintQuota>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ComplaintQuota | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ComplaintQuota): void {
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

  list(): ComplaintQuota[] {
    const out: ComplaintQuota[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryComplaintQuotaStore(): ComplaintQuotaStore {
  return new MemoryComplaintQuotaStore(new Map<string, ComplaintQuota>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedComplaintQuotaStore implements ComplaintQuotaStore {
  inner: ComplaintQuotaStore;
  cache: cache.TtlCache<ComplaintQuota>;
  hits: number;
  misses: number;

  constructor(
    inner: ComplaintQuotaStore,
    cacheValue: cache.TtlCache<ComplaintQuota>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ComplaintQuota | undefined {
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

  save(item: ComplaintQuota): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ComplaintQuota[] {
    return this.inner.list();
  }
}

export function newCachedComplaintQuotaStore(inner: ComplaintQuotaStore, ttl: number, clockValue: clock.Clock): ComplaintQuotaStore {
  return new CachedComplaintQuotaStore(inner, cache.newTtlCache<ComplaintQuota>(64, ttl, clockValue), 0, 0);
}

/** Selects complaint quotas. Empty fields match all. */
export class ComplaintQuotaQuery {
  region: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minCeiling: number, statuses: string[], limit: number) {
    this.region = region;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ComplaintQuota): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ComplaintQuota[]): ComplaintQuota[] {
    const matched = collections.filter(items, (candidate: ComplaintQuota): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findComplaintQuotas(store: ComplaintQuotaStore, query: ComplaintQuotaQuery): ComplaintQuota[] {
  return query.apply(store.list());
}
