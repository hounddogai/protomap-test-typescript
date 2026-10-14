import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyLeaderboardQuota } from "./legacy-leaderboard-quota.js";

/** Keeps legacy leaderboard quotas by code. */
export interface LegacyLeaderboardQuotaStore {
  find(code: string): LegacyLeaderboardQuota | undefined;
  save(item: LegacyLeaderboardQuota): void;
  remove(code: string): boolean;
  list(): LegacyLeaderboardQuota[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyLeaderboardQuotaStore implements LegacyLeaderboardQuotaStore {
  items: Map<string, LegacyLeaderboardQuota>;
  order: string[];

  constructor(items: Map<string, LegacyLeaderboardQuota>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyLeaderboardQuota | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyLeaderboardQuota): void {
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

  list(): LegacyLeaderboardQuota[] {
    const out: LegacyLeaderboardQuota[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyLeaderboardQuotaStore(): LegacyLeaderboardQuotaStore {
  return new MemoryLegacyLeaderboardQuotaStore(new Map<string, LegacyLeaderboardQuota>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyLeaderboardQuotaStore implements LegacyLeaderboardQuotaStore {
  inner: LegacyLeaderboardQuotaStore;
  cache: cache.TtlCache<LegacyLeaderboardQuota>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyLeaderboardQuotaStore,
    cacheValue: cache.TtlCache<LegacyLeaderboardQuota>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyLeaderboardQuota | undefined {
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

  save(item: LegacyLeaderboardQuota): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyLeaderboardQuota[] {
    return this.inner.list();
  }
}

export function newCachedLegacyLeaderboardQuotaStore(inner: LegacyLeaderboardQuotaStore, ttl: number, clockValue: clock.Clock): LegacyLeaderboardQuotaStore {
  return new CachedLegacyLeaderboardQuotaStore(
    inner,
    cache.newTtlCache<LegacyLeaderboardQuota>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy leaderboard quotas. Empty fields match all. */
export class LegacyLeaderboardQuotaQuery {
  name: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minGraceDays: number, statuses: string[], limit: number) {
    this.name = name;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyLeaderboardQuota): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyLeaderboardQuota[]): LegacyLeaderboardQuota[] {
    const matched = collections.filter(items, (candidate: LegacyLeaderboardQuota): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyLeaderboardQuotas(store: LegacyLeaderboardQuotaStore, query: LegacyLeaderboardQuotaQuery): LegacyLeaderboardQuota[] {
  return query.apply(store.list());
}
