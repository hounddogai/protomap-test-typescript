import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedLeaderboardPlan } from "./batched-leaderboard-plan.js";

/** Keeps batched leaderboard plans by code. */
export interface BatchedLeaderboardPlanStore {
  find(code: string): BatchedLeaderboardPlan | undefined;
  save(item: BatchedLeaderboardPlan): void;
  remove(code: string): boolean;
  list(): BatchedLeaderboardPlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedLeaderboardPlanStore implements BatchedLeaderboardPlanStore {
  items: Map<string, BatchedLeaderboardPlan>;
  order: string[];

  constructor(items: Map<string, BatchedLeaderboardPlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedLeaderboardPlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedLeaderboardPlan): void {
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

  list(): BatchedLeaderboardPlan[] {
    const out: BatchedLeaderboardPlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedLeaderboardPlanStore(): BatchedLeaderboardPlanStore {
  return new MemoryBatchedLeaderboardPlanStore(new Map<string, BatchedLeaderboardPlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedLeaderboardPlanStore implements BatchedLeaderboardPlanStore {
  inner: BatchedLeaderboardPlanStore;
  cache: cache.TtlCache<BatchedLeaderboardPlan>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedLeaderboardPlanStore,
    cacheValue: cache.TtlCache<BatchedLeaderboardPlan>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedLeaderboardPlan | undefined {
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

  save(item: BatchedLeaderboardPlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedLeaderboardPlan[] {
    return this.inner.list();
  }
}

export function newCachedBatchedLeaderboardPlanStore(inner: BatchedLeaderboardPlanStore, ttl: number, clockValue: clock.Clock): BatchedLeaderboardPlanStore {
  return new CachedBatchedLeaderboardPlanStore(
    inner,
    cache.newTtlCache<BatchedLeaderboardPlan>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched leaderboard plans. Empty fields match all. */
export class BatchedLeaderboardPlanQuery {
  locale: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minMaximum: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedLeaderboardPlan): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedLeaderboardPlan[]): BatchedLeaderboardPlan[] {
    const matched = collections.filter(items, (candidate: BatchedLeaderboardPlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedLeaderboardPlans(store: BatchedLeaderboardPlanStore, query: BatchedLeaderboardPlanQuery): BatchedLeaderboardPlan[] {
  return query.apply(store.list());
}
