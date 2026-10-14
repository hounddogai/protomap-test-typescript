import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedProofQuota } from "./batched-proof-quota.js";

/** Keeps batched proof quotas by code. */
export interface BatchedProofQuotaStore {
  find(code: string): BatchedProofQuota | undefined;
  save(item: BatchedProofQuota): void;
  remove(code: string): boolean;
  list(): BatchedProofQuota[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedProofQuotaStore implements BatchedProofQuotaStore {
  items: Map<string, BatchedProofQuota>;
  order: string[];

  constructor(items: Map<string, BatchedProofQuota>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedProofQuota | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedProofQuota): void {
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

  list(): BatchedProofQuota[] {
    const out: BatchedProofQuota[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedProofQuotaStore(): BatchedProofQuotaStore {
  return new MemoryBatchedProofQuotaStore(new Map<string, BatchedProofQuota>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedProofQuotaStore implements BatchedProofQuotaStore {
  inner: BatchedProofQuotaStore;
  cache: cache.TtlCache<BatchedProofQuota>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedProofQuotaStore,
    cacheValue: cache.TtlCache<BatchedProofQuota>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedProofQuota | undefined {
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

  save(item: BatchedProofQuota): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedProofQuota[] {
    return this.inner.list();
  }
}

export function newCachedBatchedProofQuotaStore(inner: BatchedProofQuotaStore, ttl: number, clockValue: clock.Clock): BatchedProofQuotaStore {
  return new CachedBatchedProofQuotaStore(inner, cache.newTtlCache<BatchedProofQuota>(128, ttl, clockValue), 0, 0);
}

/** Selects batched proof quotas. Empty fields match all. */
export class BatchedProofQuotaQuery {
  locale: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minWindowDays: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedProofQuota): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedProofQuota[]): BatchedProofQuota[] {
    const matched = collections.filter(items, (candidate: BatchedProofQuota): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedProofQuotas(store: BatchedProofQuotaStore, query: BatchedProofQuotaQuery): BatchedProofQuota[] {
  return query.apply(store.list());
}
