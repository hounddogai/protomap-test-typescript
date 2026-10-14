import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LeaderboardTier } from "./leaderboard-tier.js";

/** Keeps leaderboard tiers by code. */
export interface LeaderboardTierStore {
  find(code: string): LeaderboardTier | undefined;
  save(item: LeaderboardTier): void;
  remove(code: string): boolean;
  list(): LeaderboardTier[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLeaderboardTierStore implements LeaderboardTierStore {
  items: Map<string, LeaderboardTier>;
  order: string[];

  constructor(items: Map<string, LeaderboardTier>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LeaderboardTier | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LeaderboardTier): void {
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

  list(): LeaderboardTier[] {
    const out: LeaderboardTier[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLeaderboardTierStore(): LeaderboardTierStore {
  return new MemoryLeaderboardTierStore(new Map<string, LeaderboardTier>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLeaderboardTierStore implements LeaderboardTierStore {
  inner: LeaderboardTierStore;
  cache: cache.TtlCache<LeaderboardTier>;
  hits: number;
  misses: number;

  constructor(
    inner: LeaderboardTierStore,
    cacheValue: cache.TtlCache<LeaderboardTier>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LeaderboardTier | undefined {
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

  save(item: LeaderboardTier): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LeaderboardTier[] {
    return this.inner.list();
  }
}

export function newCachedLeaderboardTierStore(inner: LeaderboardTierStore, ttl: number, clockValue: clock.Clock): LeaderboardTierStore {
  return new CachedLeaderboardTierStore(inner, cache.newTtlCache<LeaderboardTier>(64, ttl, clockValue), 0, 0);
}

/** Selects leaderboard tiers. Empty fields match all. */
export class LeaderboardTierQuery {
  label: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minVersion: number, statuses: string[], limit: number) {
    this.label = label;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LeaderboardTier): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LeaderboardTier[]): LeaderboardTier[] {
    const matched = collections.filter(items, (candidate: LeaderboardTier): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLeaderboardTiers(store: LeaderboardTierStore, query: LeaderboardTierQuery): LeaderboardTier[] {
  return query.apply(store.list());
}
