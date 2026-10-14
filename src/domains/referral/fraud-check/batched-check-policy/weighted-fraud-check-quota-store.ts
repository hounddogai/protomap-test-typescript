import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedFraudCheckQuota } from "./weighted-fraud-check-quota.js";

/** Keeps weighted fraud check quotas by code. */
export interface WeightedFraudCheckQuotaStore {
  find(code: string): WeightedFraudCheckQuota | undefined;
  save(item: WeightedFraudCheckQuota): void;
  remove(code: string): boolean;
  list(): WeightedFraudCheckQuota[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedFraudCheckQuotaStore implements WeightedFraudCheckQuotaStore {
  items: Map<string, WeightedFraudCheckQuota>;
  order: string[];

  constructor(items: Map<string, WeightedFraudCheckQuota>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedFraudCheckQuota | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedFraudCheckQuota): void {
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

  list(): WeightedFraudCheckQuota[] {
    const out: WeightedFraudCheckQuota[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedFraudCheckQuotaStore(): WeightedFraudCheckQuotaStore {
  return new MemoryWeightedFraudCheckQuotaStore(new Map<string, WeightedFraudCheckQuota>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedFraudCheckQuotaStore implements WeightedFraudCheckQuotaStore {
  inner: WeightedFraudCheckQuotaStore;
  cache: cache.TtlCache<WeightedFraudCheckQuota>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedFraudCheckQuotaStore,
    cacheValue: cache.TtlCache<WeightedFraudCheckQuota>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedFraudCheckQuota | undefined {
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

  save(item: WeightedFraudCheckQuota): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedFraudCheckQuota[] {
    return this.inner.list();
  }
}

export function newCachedWeightedFraudCheckQuotaStore(inner: WeightedFraudCheckQuotaStore, ttl: number, clockValue: clock.Clock): WeightedFraudCheckQuotaStore {
  return new CachedWeightedFraudCheckQuotaStore(
    inner,
    cache.newTtlCache<WeightedFraudCheckQuota>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted fraud check quotas. Empty fields match all. */
export class WeightedFraudCheckQuotaQuery {
  label: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minBudget: number, statuses: string[], limit: number) {
    this.label = label;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedFraudCheckQuota): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedFraudCheckQuota[]): WeightedFraudCheckQuota[] {
    const matched = collections.filter(items, (candidate: WeightedFraudCheckQuota): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedFraudCheckQuotas(store: WeightedFraudCheckQuotaStore, query: WeightedFraudCheckQuotaQuery): WeightedFraudCheckQuota[] {
  return query.apply(store.list());
}
