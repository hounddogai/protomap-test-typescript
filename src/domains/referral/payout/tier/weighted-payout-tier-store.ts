import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedPayoutTier } from "./weighted-payout-tier.js";

/** Keeps weighted payout tiers by code. */
export interface WeightedPayoutTierStore {
  find(code: string): WeightedPayoutTier | undefined;
  save(item: WeightedPayoutTier): void;
  remove(code: string): boolean;
  list(): WeightedPayoutTier[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedPayoutTierStore implements WeightedPayoutTierStore {
  items: Map<string, WeightedPayoutTier>;
  order: string[];

  constructor(items: Map<string, WeightedPayoutTier>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedPayoutTier | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedPayoutTier): void {
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

  list(): WeightedPayoutTier[] {
    const out: WeightedPayoutTier[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedPayoutTierStore(): WeightedPayoutTierStore {
  return new MemoryWeightedPayoutTierStore(new Map<string, WeightedPayoutTier>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedPayoutTierStore implements WeightedPayoutTierStore {
  inner: WeightedPayoutTierStore;
  cache: cache.TtlCache<WeightedPayoutTier>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedPayoutTierStore,
    cacheValue: cache.TtlCache<WeightedPayoutTier>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedPayoutTier | undefined {
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

  save(item: WeightedPayoutTier): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedPayoutTier[] {
    return this.inner.list();
  }
}

export function newCachedWeightedPayoutTierStore(inner: WeightedPayoutTierStore, ttl: number, clockValue: clock.Clock): WeightedPayoutTierStore {
  return new CachedWeightedPayoutTierStore(inner, cache.newTtlCache<WeightedPayoutTier>(256, ttl, clockValue), 0, 0);
}

/** Selects weighted payout tiers. Empty fields match all. */
export class WeightedPayoutTierQuery {
  category: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minRate: number, statuses: string[], limit: number) {
    this.category = category;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedPayoutTier): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedPayoutTier[]): WeightedPayoutTier[] {
    const matched = collections.filter(items, (candidate: WeightedPayoutTier): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedPayoutTiers(store: WeightedPayoutTierStore, query: WeightedPayoutTierQuery): WeightedPayoutTier[] {
  return query.apply(store.list());
}
