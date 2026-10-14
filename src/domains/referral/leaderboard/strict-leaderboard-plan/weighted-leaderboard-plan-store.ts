import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedLeaderboardPlan } from "./weighted-leaderboard-plan.js";

/** Keeps weighted leaderboard plans by code. */
export interface WeightedLeaderboardPlanStore {
  find(code: string): WeightedLeaderboardPlan | undefined;
  save(item: WeightedLeaderboardPlan): void;
  remove(code: string): boolean;
  list(): WeightedLeaderboardPlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedLeaderboardPlanStore implements WeightedLeaderboardPlanStore {
  items: Map<string, WeightedLeaderboardPlan>;
  order: string[];

  constructor(items: Map<string, WeightedLeaderboardPlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedLeaderboardPlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedLeaderboardPlan): void {
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

  list(): WeightedLeaderboardPlan[] {
    const out: WeightedLeaderboardPlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedLeaderboardPlanStore(): WeightedLeaderboardPlanStore {
  return new MemoryWeightedLeaderboardPlanStore(new Map<string, WeightedLeaderboardPlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedLeaderboardPlanStore implements WeightedLeaderboardPlanStore {
  inner: WeightedLeaderboardPlanStore;
  cache: cache.TtlCache<WeightedLeaderboardPlan>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedLeaderboardPlanStore,
    cacheValue: cache.TtlCache<WeightedLeaderboardPlan>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedLeaderboardPlan | undefined {
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

  save(item: WeightedLeaderboardPlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedLeaderboardPlan[] {
    return this.inner.list();
  }
}

export function newCachedWeightedLeaderboardPlanStore(inner: WeightedLeaderboardPlanStore, ttl: number, clockValue: clock.Clock): WeightedLeaderboardPlanStore {
  return new CachedWeightedLeaderboardPlanStore(
    inner,
    cache.newTtlCache<WeightedLeaderboardPlan>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted leaderboard plans. Empty fields match all. */
export class WeightedLeaderboardPlanQuery {
  label: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minWeight: number, statuses: string[], limit: number) {
    this.label = label;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedLeaderboardPlan): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedLeaderboardPlan[]): WeightedLeaderboardPlan[] {
    const matched = collections.filter(items, (candidate: WeightedLeaderboardPlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedLeaderboardPlans(store: WeightedLeaderboardPlanStore, query: WeightedLeaderboardPlanQuery): WeightedLeaderboardPlan[] {
  return query.apply(store.list());
}
