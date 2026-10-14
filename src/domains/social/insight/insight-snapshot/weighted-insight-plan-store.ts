import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedInsightPlan } from "./weighted-insight-plan.js";

/** Keeps weighted insight plans by code. */
export interface WeightedInsightPlanStore {
  find(code: string): WeightedInsightPlan | undefined;
  save(item: WeightedInsightPlan): void;
  remove(code: string): boolean;
  list(): WeightedInsightPlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedInsightPlanStore implements WeightedInsightPlanStore {
  items: Map<string, WeightedInsightPlan>;
  order: string[];

  constructor(items: Map<string, WeightedInsightPlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedInsightPlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedInsightPlan): void {
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

  list(): WeightedInsightPlan[] {
    const out: WeightedInsightPlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedInsightPlanStore(): WeightedInsightPlanStore {
  return new MemoryWeightedInsightPlanStore(new Map<string, WeightedInsightPlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedInsightPlanStore implements WeightedInsightPlanStore {
  inner: WeightedInsightPlanStore;
  cache: cache.TtlCache<WeightedInsightPlan>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedInsightPlanStore,
    cacheValue: cache.TtlCache<WeightedInsightPlan>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedInsightPlan | undefined {
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

  save(item: WeightedInsightPlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedInsightPlan[] {
    return this.inner.list();
  }
}

export function newCachedWeightedInsightPlanStore(inner: WeightedInsightPlanStore, ttl: number, clockValue: clock.Clock): WeightedInsightPlanStore {
  return new CachedWeightedInsightPlanStore(inner, cache.newTtlCache<WeightedInsightPlan>(512, ttl, clockValue), 0, 0);
}

/** Selects weighted insight plans. Empty fields match all. */
export class WeightedInsightPlanQuery {
  channel: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minAttempts: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedInsightPlan): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedInsightPlan[]): WeightedInsightPlan[] {
    const matched = collections.filter(items, (candidate: WeightedInsightPlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedInsightPlans(store: WeightedInsightPlanStore, query: WeightedInsightPlanQuery): WeightedInsightPlan[] {
  return query.apply(store.list());
}
