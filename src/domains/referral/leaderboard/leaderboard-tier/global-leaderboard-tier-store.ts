import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalLeaderboardTier } from "./global-leaderboard-tier.js";

/** Keeps global leaderboard tiers by code. */
export interface GlobalLeaderboardTierStore {
  find(code: string): GlobalLeaderboardTier | undefined;
  save(item: GlobalLeaderboardTier): void;
  remove(code: string): boolean;
  list(): GlobalLeaderboardTier[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalLeaderboardTierStore implements GlobalLeaderboardTierStore {
  items: Map<string, GlobalLeaderboardTier>;
  order: string[];

  constructor(items: Map<string, GlobalLeaderboardTier>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalLeaderboardTier | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalLeaderboardTier): void {
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

  list(): GlobalLeaderboardTier[] {
    const out: GlobalLeaderboardTier[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalLeaderboardTierStore(): GlobalLeaderboardTierStore {
  return new MemoryGlobalLeaderboardTierStore(new Map<string, GlobalLeaderboardTier>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalLeaderboardTierStore implements GlobalLeaderboardTierStore {
  inner: GlobalLeaderboardTierStore;
  cache: cache.TtlCache<GlobalLeaderboardTier>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalLeaderboardTierStore,
    cacheValue: cache.TtlCache<GlobalLeaderboardTier>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalLeaderboardTier | undefined {
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

  save(item: GlobalLeaderboardTier): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalLeaderboardTier[] {
    return this.inner.list();
  }
}

export function newCachedGlobalLeaderboardTierStore(inner: GlobalLeaderboardTierStore, ttl: number, clockValue: clock.Clock): GlobalLeaderboardTierStore {
  return new CachedGlobalLeaderboardTierStore(
    inner,
    cache.newTtlCache<GlobalLeaderboardTier>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects global leaderboard tiers. Empty fields match all. */
export class GlobalLeaderboardTierQuery {
  label: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minRate: number, statuses: string[], limit: number) {
    this.label = label;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalLeaderboardTier): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalLeaderboardTier[]): GlobalLeaderboardTier[] {
    const matched = collections.filter(items, (candidate: GlobalLeaderboardTier): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalLeaderboardTiers(store: GlobalLeaderboardTierStore, query: GlobalLeaderboardTierQuery): GlobalLeaderboardTier[] {
  return query.apply(store.list());
}
