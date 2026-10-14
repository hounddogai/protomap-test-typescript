import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictRewardRuleQuota } from "./strict-reward-rule-quota.js";

/** Keeps strict reward rule quotas by code. */
export interface StrictRewardRuleQuotaStore {
  find(code: string): StrictRewardRuleQuota | undefined;
  save(item: StrictRewardRuleQuota): void;
  remove(code: string): boolean;
  list(): StrictRewardRuleQuota[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictRewardRuleQuotaStore implements StrictRewardRuleQuotaStore {
  items: Map<string, StrictRewardRuleQuota>;
  order: string[];

  constructor(items: Map<string, StrictRewardRuleQuota>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictRewardRuleQuota | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictRewardRuleQuota): void {
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

  list(): StrictRewardRuleQuota[] {
    const out: StrictRewardRuleQuota[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictRewardRuleQuotaStore(): StrictRewardRuleQuotaStore {
  return new MemoryStrictRewardRuleQuotaStore(new Map<string, StrictRewardRuleQuota>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictRewardRuleQuotaStore implements StrictRewardRuleQuotaStore {
  inner: StrictRewardRuleQuotaStore;
  cache: cache.TtlCache<StrictRewardRuleQuota>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictRewardRuleQuotaStore,
    cacheValue: cache.TtlCache<StrictRewardRuleQuota>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictRewardRuleQuota | undefined {
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

  save(item: StrictRewardRuleQuota): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictRewardRuleQuota[] {
    return this.inner.list();
  }
}

export function newCachedStrictRewardRuleQuotaStore(inner: StrictRewardRuleQuotaStore, ttl: number, clockValue: clock.Clock): StrictRewardRuleQuotaStore {
  return new CachedStrictRewardRuleQuotaStore(
    inner,
    cache.newTtlCache<StrictRewardRuleQuota>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects strict reward rule quotas. Empty fields match all. */
export class StrictRewardRuleQuotaQuery {
  region: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minSendAt: number, statuses: string[], limit: number) {
    this.region = region;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictRewardRuleQuota): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictRewardRuleQuota[]): StrictRewardRuleQuota[] {
    const matched = collections.filter(items, (candidate: StrictRewardRuleQuota): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictRewardRuleQuotas(store: StrictRewardRuleQuotaStore, query: StrictRewardRuleQuotaQuery): StrictRewardRuleQuota[] {
  return query.apply(store.list());
}
