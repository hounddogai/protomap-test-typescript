import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualLeaderboardQuota } from "./manual-leaderboard-quota.js";

/** Keeps manual leaderboard quotas by code. */
export interface ManualLeaderboardQuotaStore {
  find(code: string): ManualLeaderboardQuota | undefined;
  save(item: ManualLeaderboardQuota): void;
  remove(code: string): boolean;
  list(): ManualLeaderboardQuota[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualLeaderboardQuotaStore implements ManualLeaderboardQuotaStore {
  items: Map<string, ManualLeaderboardQuota>;
  order: string[];

  constructor(items: Map<string, ManualLeaderboardQuota>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualLeaderboardQuota | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualLeaderboardQuota): void {
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

  list(): ManualLeaderboardQuota[] {
    const out: ManualLeaderboardQuota[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualLeaderboardQuotaStore(): ManualLeaderboardQuotaStore {
  return new MemoryManualLeaderboardQuotaStore(new Map<string, ManualLeaderboardQuota>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualLeaderboardQuotaStore implements ManualLeaderboardQuotaStore {
  inner: ManualLeaderboardQuotaStore;
  cache: cache.TtlCache<ManualLeaderboardQuota>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualLeaderboardQuotaStore,
    cacheValue: cache.TtlCache<ManualLeaderboardQuota>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualLeaderboardQuota | undefined {
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

  save(item: ManualLeaderboardQuota): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualLeaderboardQuota[] {
    return this.inner.list();
  }
}

export function newCachedManualLeaderboardQuotaStore(inner: ManualLeaderboardQuotaStore, ttl: number, clockValue: clock.Clock): ManualLeaderboardQuotaStore {
  return new CachedManualLeaderboardQuotaStore(
    inner,
    cache.newTtlCache<ManualLeaderboardQuota>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects manual leaderboard quotas. Empty fields match all. */
export class ManualLeaderboardQuotaQuery {
  locale: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minSequence: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualLeaderboardQuota): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualLeaderboardQuota[]): ManualLeaderboardQuota[] {
    const matched = collections.filter(items, (candidate: ManualLeaderboardQuota): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualLeaderboardQuotas(store: ManualLeaderboardQuotaStore, query: ManualLeaderboardQuotaQuery): ManualLeaderboardQuota[] {
  return query.apply(store.list());
}
