import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualSubscriptionTier } from "./manual-subscription-tier.js";

/** Keeps manual subscription tiers by code. */
export interface ManualSubscriptionTierStore {
  find(code: string): ManualSubscriptionTier | undefined;
  save(item: ManualSubscriptionTier): void;
  remove(code: string): boolean;
  list(): ManualSubscriptionTier[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualSubscriptionTierStore implements ManualSubscriptionTierStore {
  items: Map<string, ManualSubscriptionTier>;
  order: string[];

  constructor(items: Map<string, ManualSubscriptionTier>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualSubscriptionTier | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualSubscriptionTier): void {
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

  list(): ManualSubscriptionTier[] {
    const out: ManualSubscriptionTier[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualSubscriptionTierStore(): ManualSubscriptionTierStore {
  return new MemoryManualSubscriptionTierStore(new Map<string, ManualSubscriptionTier>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualSubscriptionTierStore implements ManualSubscriptionTierStore {
  inner: ManualSubscriptionTierStore;
  cache: cache.TtlCache<ManualSubscriptionTier>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualSubscriptionTierStore,
    cacheValue: cache.TtlCache<ManualSubscriptionTier>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualSubscriptionTier | undefined {
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

  save(item: ManualSubscriptionTier): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualSubscriptionTier[] {
    return this.inner.list();
  }
}

export function newCachedManualSubscriptionTierStore(inner: ManualSubscriptionTierStore, ttl: number, clockValue: clock.Clock): ManualSubscriptionTierStore {
  return new CachedManualSubscriptionTierStore(
    inner,
    cache.newTtlCache<ManualSubscriptionTier>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects manual subscription tiers. Empty fields match all. */
export class ManualSubscriptionTierQuery {
  unit: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minCeiling: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualSubscriptionTier): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualSubscriptionTier[]): ManualSubscriptionTier[] {
    const matched = collections.filter(items, (candidate: ManualSubscriptionTier): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualSubscriptionTiers(store: ManualSubscriptionTierStore, query: ManualSubscriptionTierQuery): ManualSubscriptionTier[] {
  return query.apply(store.list());
}
