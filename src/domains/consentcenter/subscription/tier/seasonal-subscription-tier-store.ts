import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalSubscriptionTier } from "./seasonal-subscription-tier.js";

/** Keeps seasonal subscription tiers by code. */
export interface SeasonalSubscriptionTierStore {
  find(code: string): SeasonalSubscriptionTier | undefined;
  save(item: SeasonalSubscriptionTier): void;
  remove(code: string): boolean;
  list(): SeasonalSubscriptionTier[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalSubscriptionTierStore implements SeasonalSubscriptionTierStore {
  items: Map<string, SeasonalSubscriptionTier>;
  order: string[];

  constructor(items: Map<string, SeasonalSubscriptionTier>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalSubscriptionTier | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalSubscriptionTier): void {
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

  list(): SeasonalSubscriptionTier[] {
    const out: SeasonalSubscriptionTier[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalSubscriptionTierStore(): SeasonalSubscriptionTierStore {
  return new MemorySeasonalSubscriptionTierStore(new Map<string, SeasonalSubscriptionTier>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalSubscriptionTierStore implements SeasonalSubscriptionTierStore {
  inner: SeasonalSubscriptionTierStore;
  cache: cache.TtlCache<SeasonalSubscriptionTier>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalSubscriptionTierStore,
    cacheValue: cache.TtlCache<SeasonalSubscriptionTier>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalSubscriptionTier | undefined {
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

  save(item: SeasonalSubscriptionTier): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalSubscriptionTier[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalSubscriptionTierStore(inner: SeasonalSubscriptionTierStore, ttl: number, clockValue: clock.Clock): SeasonalSubscriptionTierStore {
  return new CachedSeasonalSubscriptionTierStore(
    inner,
    cache.newTtlCache<SeasonalSubscriptionTier>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal subscription tiers. Empty fields match all. */
export class SeasonalSubscriptionTierQuery {
  region: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minBudget: number, statuses: string[], limit: number) {
    this.region = region;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalSubscriptionTier): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalSubscriptionTier[]): SeasonalSubscriptionTier[] {
    const matched = collections.filter(items, (candidate: SeasonalSubscriptionTier): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalSubscriptionTiers(store: SeasonalSubscriptionTierStore, query: SeasonalSubscriptionTierQuery): SeasonalSubscriptionTier[] {
  return query.apply(store.list());
}
