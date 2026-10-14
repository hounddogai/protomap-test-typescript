import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ApprovalQuota } from "./approval-quota.js";

/** Keeps approval quotas by code. */
export interface ApprovalQuotaStore {
  find(code: string): ApprovalQuota | undefined;
  save(item: ApprovalQuota): void;
  remove(code: string): boolean;
  list(): ApprovalQuota[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryApprovalQuotaStore implements ApprovalQuotaStore {
  items: Map<string, ApprovalQuota>;
  order: string[];

  constructor(items: Map<string, ApprovalQuota>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ApprovalQuota | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ApprovalQuota): void {
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

  list(): ApprovalQuota[] {
    const out: ApprovalQuota[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryApprovalQuotaStore(): ApprovalQuotaStore {
  return new MemoryApprovalQuotaStore(new Map<string, ApprovalQuota>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedApprovalQuotaStore implements ApprovalQuotaStore {
  inner: ApprovalQuotaStore;
  cache: cache.TtlCache<ApprovalQuota>;
  hits: number;
  misses: number;

  constructor(inner: ApprovalQuotaStore, cacheValue: cache.TtlCache<ApprovalQuota>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ApprovalQuota | undefined {
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

  save(item: ApprovalQuota): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ApprovalQuota[] {
    return this.inner.list();
  }
}

export function newCachedApprovalQuotaStore(inner: ApprovalQuotaStore, ttl: number, clockValue: clock.Clock): ApprovalQuotaStore {
  return new CachedApprovalQuotaStore(inner, cache.newTtlCache<ApprovalQuota>(128, ttl, clockValue), 0, 0);
}

/** Selects approval quotas. Empty fields match all. */
export class ApprovalQuotaQuery {
  label: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minGraceDays: number, statuses: string[], limit: number) {
    this.label = label;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ApprovalQuota): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ApprovalQuota[]): ApprovalQuota[] {
    const matched = collections.filter(items, (candidate: ApprovalQuota): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findApprovalQuotas(store: ApprovalQuotaStore, query: ApprovalQuotaQuery): ApprovalQuota[] {
  return query.apply(store.list());
}
