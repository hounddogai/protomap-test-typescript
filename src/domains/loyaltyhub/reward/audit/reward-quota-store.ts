import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RewardQuota } from "./reward-quota.js";

/** Keeps reward quotas by code. */
export interface RewardQuotaStore {
  find(code: string): RewardQuota | undefined;
  save(item: RewardQuota): void;
  remove(code: string): boolean;
  list(): RewardQuota[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRewardQuotaStore implements RewardQuotaStore {
  items: Map<string, RewardQuota>;
  order: string[];

  constructor(items: Map<string, RewardQuota>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RewardQuota | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RewardQuota): void {
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

  list(): RewardQuota[] {
    const out: RewardQuota[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRewardQuotaStore(): RewardQuotaStore {
  return new MemoryRewardQuotaStore(new Map<string, RewardQuota>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRewardQuotaStore implements RewardQuotaStore {
  inner: RewardQuotaStore;
  cache: cache.TtlCache<RewardQuota>;
  hits: number;
  misses: number;

  constructor(inner: RewardQuotaStore, cacheValue: cache.TtlCache<RewardQuota>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RewardQuota | undefined {
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

  save(item: RewardQuota): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RewardQuota[] {
    return this.inner.list();
  }
}

export function newCachedRewardQuotaStore(inner: RewardQuotaStore, ttl: number, clockValue: clock.Clock): RewardQuotaStore {
  return new CachedRewardQuotaStore(inner, cache.newTtlCache<RewardQuota>(256, ttl, clockValue), 0, 0);
}

/** Selects reward quotas. Empty fields match all. */
export class RewardQuotaQuery {
  channel: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minDiscount: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RewardQuota): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RewardQuota[]): RewardQuota[] {
    const matched = collections.filter(items, (candidate: RewardQuota): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRewardQuotas(store: RewardQuotaStore, query: RewardQuotaQuery): RewardQuota[] {
  return query.apply(store.list());
}
