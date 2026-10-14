import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RewardTier } from "./reward-tier.js";

/** Keeps reward tiers by code. */
export interface RewardTierStore {
  find(code: string): RewardTier | undefined;
  save(item: RewardTier): void;
  remove(code: string): boolean;
  list(): RewardTier[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRewardTierStore implements RewardTierStore {
  items: Map<string, RewardTier>;
  order: string[];

  constructor(items: Map<string, RewardTier>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RewardTier | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RewardTier): void {
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

  list(): RewardTier[] {
    const out: RewardTier[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRewardTierStore(): RewardTierStore {
  return new MemoryRewardTierStore(new Map<string, RewardTier>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRewardTierStore implements RewardTierStore {
  inner: RewardTierStore;
  cache: cache.TtlCache<RewardTier>;
  hits: number;
  misses: number;

  constructor(inner: RewardTierStore, cacheValue: cache.TtlCache<RewardTier>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RewardTier | undefined {
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

  save(item: RewardTier): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RewardTier[] {
    return this.inner.list();
  }
}

export function newCachedRewardTierStore(inner: RewardTierStore, ttl: number, clockValue: clock.Clock): RewardTierStore {
  return new CachedRewardTierStore(inner, cache.newTtlCache<RewardTier>(256, ttl, clockValue), 0, 0);
}

/** Selects reward tiers. Empty fields match all. */
export class RewardTierQuery {
  country: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minRate: number, statuses: string[], limit: number) {
    this.country = country;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RewardTier): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RewardTier[]): RewardTier[] {
    const matched = collections.filter(items, (candidate: RewardTier): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRewardTiers(store: RewardTierStore, query: RewardTierQuery): RewardTier[] {
  return query.apply(store.list());
}
