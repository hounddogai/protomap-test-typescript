import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedOptOutPlan } from "./weighted-opt-out-plan.js";

/** Keeps weighted opt out plans by code. */
export interface WeightedOptOutPlanStore {
  find(code: string): WeightedOptOutPlan | undefined;
  save(item: WeightedOptOutPlan): void;
  remove(code: string): boolean;
  list(): WeightedOptOutPlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedOptOutPlanStore implements WeightedOptOutPlanStore {
  items: Map<string, WeightedOptOutPlan>;
  order: string[];

  constructor(items: Map<string, WeightedOptOutPlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedOptOutPlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedOptOutPlan): void {
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

  list(): WeightedOptOutPlan[] {
    const out: WeightedOptOutPlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedOptOutPlanStore(): WeightedOptOutPlanStore {
  return new MemoryWeightedOptOutPlanStore(new Map<string, WeightedOptOutPlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedOptOutPlanStore implements WeightedOptOutPlanStore {
  inner: WeightedOptOutPlanStore;
  cache: cache.TtlCache<WeightedOptOutPlan>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedOptOutPlanStore,
    cacheValue: cache.TtlCache<WeightedOptOutPlan>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedOptOutPlan | undefined {
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

  save(item: WeightedOptOutPlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedOptOutPlan[] {
    return this.inner.list();
  }
}

export function newCachedWeightedOptOutPlanStore(inner: WeightedOptOutPlanStore, ttl: number, clockValue: clock.Clock): WeightedOptOutPlanStore {
  return new CachedWeightedOptOutPlanStore(inner, cache.newTtlCache<WeightedOptOutPlan>(128, ttl, clockValue), 0, 0);
}

/** Selects weighted opt out plans. Empty fields match all. */
export class WeightedOptOutPlanQuery {
  segment: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minWindowDays: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedOptOutPlan): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedOptOutPlan[]): WeightedOptOutPlan[] {
    const matched = collections.filter(items, (candidate: WeightedOptOutPlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedOptOutPlans(store: WeightedOptOutPlanStore, query: WeightedOptOutPlanQuery): WeightedOptOutPlan[] {
  return query.apply(store.list());
}
