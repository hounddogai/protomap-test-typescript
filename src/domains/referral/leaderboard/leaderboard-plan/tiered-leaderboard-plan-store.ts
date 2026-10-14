import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredLeaderboardPlan } from "./tiered-leaderboard-plan.js";

/** Keeps tiered leaderboard plans by code. */
export interface TieredLeaderboardPlanStore {
  find(code: string): TieredLeaderboardPlan | undefined;
  save(item: TieredLeaderboardPlan): void;
  remove(code: string): boolean;
  list(): TieredLeaderboardPlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredLeaderboardPlanStore implements TieredLeaderboardPlanStore {
  items: Map<string, TieredLeaderboardPlan>;
  order: string[];

  constructor(items: Map<string, TieredLeaderboardPlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredLeaderboardPlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredLeaderboardPlan): void {
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

  list(): TieredLeaderboardPlan[] {
    const out: TieredLeaderboardPlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredLeaderboardPlanStore(): TieredLeaderboardPlanStore {
  return new MemoryTieredLeaderboardPlanStore(new Map<string, TieredLeaderboardPlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredLeaderboardPlanStore implements TieredLeaderboardPlanStore {
  inner: TieredLeaderboardPlanStore;
  cache: cache.TtlCache<TieredLeaderboardPlan>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredLeaderboardPlanStore,
    cacheValue: cache.TtlCache<TieredLeaderboardPlan>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredLeaderboardPlan | undefined {
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

  save(item: TieredLeaderboardPlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredLeaderboardPlan[] {
    return this.inner.list();
  }
}

export function newCachedTieredLeaderboardPlanStore(inner: TieredLeaderboardPlanStore, ttl: number, clockValue: clock.Clock): TieredLeaderboardPlanStore {
  return new CachedTieredLeaderboardPlanStore(
    inner,
    cache.newTtlCache<TieredLeaderboardPlan>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered leaderboard plans. Empty fields match all. */
export class TieredLeaderboardPlanQuery {
  channel: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredLeaderboardPlan): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredLeaderboardPlan[]): TieredLeaderboardPlan[] {
    const matched = collections.filter(items, (candidate: TieredLeaderboardPlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredLeaderboardPlans(store: TieredLeaderboardPlanStore, query: TieredLeaderboardPlanQuery): TieredLeaderboardPlan[] {
  return query.apply(store.list());
}
