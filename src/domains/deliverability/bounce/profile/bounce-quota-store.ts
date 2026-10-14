import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BounceQuota } from "./bounce-quota.js";

/** Keeps bounce quotas by code. */
export interface BounceQuotaStore {
  find(code: string): BounceQuota | undefined;
  save(item: BounceQuota): void;
  remove(code: string): boolean;
  list(): BounceQuota[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBounceQuotaStore implements BounceQuotaStore {
  items: Map<string, BounceQuota>;
  order: string[];

  constructor(items: Map<string, BounceQuota>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BounceQuota | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BounceQuota): void {
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

  list(): BounceQuota[] {
    const out: BounceQuota[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBounceQuotaStore(): BounceQuotaStore {
  return new MemoryBounceQuotaStore(new Map<string, BounceQuota>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBounceQuotaStore implements BounceQuotaStore {
  inner: BounceQuotaStore;
  cache: cache.TtlCache<BounceQuota>;
  hits: number;
  misses: number;

  constructor(inner: BounceQuotaStore, cacheValue: cache.TtlCache<BounceQuota>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BounceQuota | undefined {
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

  save(item: BounceQuota): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BounceQuota[] {
    return this.inner.list();
  }
}

export function newCachedBounceQuotaStore(inner: BounceQuotaStore, ttl: number, clockValue: clock.Clock): BounceQuotaStore {
  return new CachedBounceQuotaStore(inner, cache.newTtlCache<BounceQuota>(512, ttl, clockValue), 0, 0);
}

/** Selects bounce quotas. Empty fields match all. */
export class BounceQuotaQuery {
  channel: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minRetries: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BounceQuota): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BounceQuota[]): BounceQuota[] {
    const matched = collections.filter(items, (candidate: BounceQuota): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBounceQuotas(store: BounceQuotaStore, query: BounceQuotaQuery): BounceQuota[] {
  return query.apply(store.list());
}
