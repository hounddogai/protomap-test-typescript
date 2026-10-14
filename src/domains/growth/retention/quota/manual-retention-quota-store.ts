import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualRetentionQuota } from "./manual-retention-quota.js";

/** Keeps manual retention quotas by code. */
export interface ManualRetentionQuotaStore {
  find(code: string): ManualRetentionQuota | undefined;
  save(item: ManualRetentionQuota): void;
  remove(code: string): boolean;
  list(): ManualRetentionQuota[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualRetentionQuotaStore implements ManualRetentionQuotaStore {
  items: Map<string, ManualRetentionQuota>;
  order: string[];

  constructor(items: Map<string, ManualRetentionQuota>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualRetentionQuota | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualRetentionQuota): void {
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

  list(): ManualRetentionQuota[] {
    const out: ManualRetentionQuota[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualRetentionQuotaStore(): ManualRetentionQuotaStore {
  return new MemoryManualRetentionQuotaStore(new Map<string, ManualRetentionQuota>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualRetentionQuotaStore implements ManualRetentionQuotaStore {
  inner: ManualRetentionQuotaStore;
  cache: cache.TtlCache<ManualRetentionQuota>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualRetentionQuotaStore,
    cacheValue: cache.TtlCache<ManualRetentionQuota>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualRetentionQuota | undefined {
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

  save(item: ManualRetentionQuota): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualRetentionQuota[] {
    return this.inner.list();
  }
}

export function newCachedManualRetentionQuotaStore(inner: ManualRetentionQuotaStore, ttl: number, clockValue: clock.Clock): ManualRetentionQuotaStore {
  return new CachedManualRetentionQuotaStore(inner, cache.newTtlCache<ManualRetentionQuota>(64, ttl, clockValue), 0, 0);
}

/** Selects manual retention quotas. Empty fields match all. */
export class ManualRetentionQuotaQuery {
  channel: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minBatchSize: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualRetentionQuota): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualRetentionQuota[]): ManualRetentionQuota[] {
    const matched = collections.filter(items, (candidate: ManualRetentionQuota): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualRetentionQuotas(store: ManualRetentionQuotaStore, query: ManualRetentionQuotaQuery): ManualRetentionQuota[] {
  return query.apply(store.list());
}
