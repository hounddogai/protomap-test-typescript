import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedPostQuota } from "./batched-post-quota.js";

/** Keeps batched post quotas by code. */
export interface BatchedPostQuotaStore {
  find(code: string): BatchedPostQuota | undefined;
  save(item: BatchedPostQuota): void;
  remove(code: string): boolean;
  list(): BatchedPostQuota[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedPostQuotaStore implements BatchedPostQuotaStore {
  items: Map<string, BatchedPostQuota>;
  order: string[];

  constructor(items: Map<string, BatchedPostQuota>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedPostQuota | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedPostQuota): void {
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

  list(): BatchedPostQuota[] {
    const out: BatchedPostQuota[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedPostQuotaStore(): BatchedPostQuotaStore {
  return new MemoryBatchedPostQuotaStore(new Map<string, BatchedPostQuota>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedPostQuotaStore implements BatchedPostQuotaStore {
  inner: BatchedPostQuotaStore;
  cache: cache.TtlCache<BatchedPostQuota>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedPostQuotaStore,
    cacheValue: cache.TtlCache<BatchedPostQuota>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedPostQuota | undefined {
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

  save(item: BatchedPostQuota): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedPostQuota[] {
    return this.inner.list();
  }
}

export function newCachedBatchedPostQuotaStore(inner: BatchedPostQuotaStore, ttl: number, clockValue: clock.Clock): BatchedPostQuotaStore {
  return new CachedBatchedPostQuotaStore(inner, cache.newTtlCache<BatchedPostQuota>(64, ttl, clockValue), 0, 0);
}

/** Selects batched post quotas. Empty fields match all. */
export class BatchedPostQuotaQuery {
  country: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minRate: number, statuses: string[], limit: number) {
    this.country = country;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedPostQuota): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedPostQuota[]): BatchedPostQuota[] {
    const matched = collections.filter(items, (candidate: BatchedPostQuota): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedPostQuotas(store: BatchedPostQuotaStore, query: BatchedPostQuotaQuery): BatchedPostQuota[] {
  return query.apply(store.list());
}
