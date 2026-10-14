import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualApprovalQuota } from "./manual-approval-quota.js";

/** Keeps manual approval quotas by code. */
export interface ManualApprovalQuotaStore {
  find(code: string): ManualApprovalQuota | undefined;
  save(item: ManualApprovalQuota): void;
  remove(code: string): boolean;
  list(): ManualApprovalQuota[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualApprovalQuotaStore implements ManualApprovalQuotaStore {
  items: Map<string, ManualApprovalQuota>;
  order: string[];

  constructor(items: Map<string, ManualApprovalQuota>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualApprovalQuota | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualApprovalQuota): void {
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

  list(): ManualApprovalQuota[] {
    const out: ManualApprovalQuota[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualApprovalQuotaStore(): ManualApprovalQuotaStore {
  return new MemoryManualApprovalQuotaStore(new Map<string, ManualApprovalQuota>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualApprovalQuotaStore implements ManualApprovalQuotaStore {
  inner: ManualApprovalQuotaStore;
  cache: cache.TtlCache<ManualApprovalQuota>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualApprovalQuotaStore,
    cacheValue: cache.TtlCache<ManualApprovalQuota>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualApprovalQuota | undefined {
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

  save(item: ManualApprovalQuota): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualApprovalQuota[] {
    return this.inner.list();
  }
}

export function newCachedManualApprovalQuotaStore(inner: ManualApprovalQuotaStore, ttl: number, clockValue: clock.Clock): ManualApprovalQuotaStore {
  return new CachedManualApprovalQuotaStore(inner, cache.newTtlCache<ManualApprovalQuota>(1024, ttl, clockValue), 0, 0);
}

/** Selects manual approval quotas. Empty fields match all. */
export class ManualApprovalQuotaQuery {
  locale: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minThreshold: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualApprovalQuota): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualApprovalQuota[]): ManualApprovalQuota[] {
    const matched = collections.filter(items, (candidate: ManualApprovalQuota): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualApprovalQuotas(store: ManualApprovalQuotaStore, query: ManualApprovalQuotaQuery): ManualApprovalQuota[] {
  return query.apply(store.list());
}
