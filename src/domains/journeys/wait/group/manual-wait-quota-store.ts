import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualWaitQuota } from "./manual-wait-quota.js";

/** Keeps manual wait quotas by code. */
export interface ManualWaitQuotaStore {
  find(code: string): ManualWaitQuota | undefined;
  save(item: ManualWaitQuota): void;
  remove(code: string): boolean;
  list(): ManualWaitQuota[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualWaitQuotaStore implements ManualWaitQuotaStore {
  items: Map<string, ManualWaitQuota>;
  order: string[];

  constructor(items: Map<string, ManualWaitQuota>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualWaitQuota | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualWaitQuota): void {
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

  list(): ManualWaitQuota[] {
    const out: ManualWaitQuota[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualWaitQuotaStore(): ManualWaitQuotaStore {
  return new MemoryManualWaitQuotaStore(new Map<string, ManualWaitQuota>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualWaitQuotaStore implements ManualWaitQuotaStore {
  inner: ManualWaitQuotaStore;
  cache: cache.TtlCache<ManualWaitQuota>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualWaitQuotaStore,
    cacheValue: cache.TtlCache<ManualWaitQuota>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualWaitQuota | undefined {
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

  save(item: ManualWaitQuota): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualWaitQuota[] {
    return this.inner.list();
  }
}

export function newCachedManualWaitQuotaStore(inner: ManualWaitQuotaStore, ttl: number, clockValue: clock.Clock): ManualWaitQuotaStore {
  return new CachedManualWaitQuotaStore(inner, cache.newTtlCache<ManualWaitQuota>(128, ttl, clockValue), 0, 0);
}

/** Selects manual wait quotas. Empty fields match all. */
export class ManualWaitQuotaQuery {
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

  matches(item: ManualWaitQuota): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualWaitQuota[]): ManualWaitQuota[] {
    const matched = collections.filter(items, (candidate: ManualWaitQuota): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualWaitQuotas(store: ManualWaitQuotaStore, query: ManualWaitQuotaQuery): ManualWaitQuota[] {
  return query.apply(store.list());
}
