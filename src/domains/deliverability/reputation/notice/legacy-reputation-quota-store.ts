import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyReputationQuota } from "./legacy-reputation-quota.js";

/** Keeps legacy reputation quotas by code. */
export interface LegacyReputationQuotaStore {
  find(code: string): LegacyReputationQuota | undefined;
  save(item: LegacyReputationQuota): void;
  remove(code: string): boolean;
  list(): LegacyReputationQuota[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyReputationQuotaStore implements LegacyReputationQuotaStore {
  items: Map<string, LegacyReputationQuota>;
  order: string[];

  constructor(items: Map<string, LegacyReputationQuota>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyReputationQuota | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyReputationQuota): void {
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

  list(): LegacyReputationQuota[] {
    const out: LegacyReputationQuota[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyReputationQuotaStore(): LegacyReputationQuotaStore {
  return new MemoryLegacyReputationQuotaStore(new Map<string, LegacyReputationQuota>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyReputationQuotaStore implements LegacyReputationQuotaStore {
  inner: LegacyReputationQuotaStore;
  cache: cache.TtlCache<LegacyReputationQuota>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyReputationQuotaStore,
    cacheValue: cache.TtlCache<LegacyReputationQuota>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyReputationQuota | undefined {
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

  save(item: LegacyReputationQuota): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyReputationQuota[] {
    return this.inner.list();
  }
}

export function newCachedLegacyReputationQuotaStore(inner: LegacyReputationQuotaStore, ttl: number, clockValue: clock.Clock): LegacyReputationQuotaStore {
  return new CachedLegacyReputationQuotaStore(
    inner,
    cache.newTtlCache<LegacyReputationQuota>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy reputation quotas. Empty fields match all. */
export class LegacyReputationQuotaQuery {
  country: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minBudget: number, statuses: string[], limit: number) {
    this.country = country;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyReputationQuota): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyReputationQuota[]): LegacyReputationQuota[] {
    const matched = collections.filter(items, (candidate: LegacyReputationQuota): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyReputationQuotas(store: LegacyReputationQuotaStore, query: LegacyReputationQuotaQuery): LegacyReputationQuota[] {
  return query.apply(store.list());
}
