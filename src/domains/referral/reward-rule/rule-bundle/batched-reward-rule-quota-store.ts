import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedRewardRuleQuota } from "./batched-reward-rule-quota.js";

/** Keeps batched reward rule quotas by code. */
export interface BatchedRewardRuleQuotaStore {
  find(code: string): BatchedRewardRuleQuota | undefined;
  save(item: BatchedRewardRuleQuota): void;
  remove(code: string): boolean;
  list(): BatchedRewardRuleQuota[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedRewardRuleQuotaStore implements BatchedRewardRuleQuotaStore {
  items: Map<string, BatchedRewardRuleQuota>;
  order: string[];

  constructor(items: Map<string, BatchedRewardRuleQuota>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedRewardRuleQuota | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedRewardRuleQuota): void {
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

  list(): BatchedRewardRuleQuota[] {
    const out: BatchedRewardRuleQuota[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedRewardRuleQuotaStore(): BatchedRewardRuleQuotaStore {
  return new MemoryBatchedRewardRuleQuotaStore(new Map<string, BatchedRewardRuleQuota>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedRewardRuleQuotaStore implements BatchedRewardRuleQuotaStore {
  inner: BatchedRewardRuleQuotaStore;
  cache: cache.TtlCache<BatchedRewardRuleQuota>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedRewardRuleQuotaStore,
    cacheValue: cache.TtlCache<BatchedRewardRuleQuota>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedRewardRuleQuota | undefined {
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

  save(item: BatchedRewardRuleQuota): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedRewardRuleQuota[] {
    return this.inner.list();
  }
}

export function newCachedBatchedRewardRuleQuotaStore(inner: BatchedRewardRuleQuotaStore, ttl: number, clockValue: clock.Clock): BatchedRewardRuleQuotaStore {
  return new CachedBatchedRewardRuleQuotaStore(
    inner,
    cache.newTtlCache<BatchedRewardRuleQuota>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched reward rule quotas. Empty fields match all. */
export class BatchedRewardRuleQuotaQuery {
  utmSource: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minMargin: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedRewardRuleQuota): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedRewardRuleQuota[]): BatchedRewardRuleQuota[] {
    const matched = collections.filter(items, (candidate: BatchedRewardRuleQuota): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedRewardRuleQuotas(store: BatchedRewardRuleQuotaStore, query: BatchedRewardRuleQuotaQuery): BatchedRewardRuleQuota[] {
  return query.apply(store.list());
}
