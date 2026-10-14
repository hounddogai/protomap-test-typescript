import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedFlightPlan } from "./weighted-flight-plan.js";

/** Keeps weighted flight plans by code. */
export interface WeightedFlightPlanStore {
  find(code: string): WeightedFlightPlan | undefined;
  save(item: WeightedFlightPlan): void;
  remove(code: string): boolean;
  list(): WeightedFlightPlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedFlightPlanStore implements WeightedFlightPlanStore {
  items: Map<string, WeightedFlightPlan>;
  order: string[];

  constructor(items: Map<string, WeightedFlightPlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedFlightPlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedFlightPlan): void {
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

  list(): WeightedFlightPlan[] {
    const out: WeightedFlightPlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedFlightPlanStore(): WeightedFlightPlanStore {
  return new MemoryWeightedFlightPlanStore(new Map<string, WeightedFlightPlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedFlightPlanStore implements WeightedFlightPlanStore {
  inner: WeightedFlightPlanStore;
  cache: cache.TtlCache<WeightedFlightPlan>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedFlightPlanStore,
    cacheValue: cache.TtlCache<WeightedFlightPlan>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedFlightPlan | undefined {
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

  save(item: WeightedFlightPlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedFlightPlan[] {
    return this.inner.list();
  }
}

export function newCachedWeightedFlightPlanStore(inner: WeightedFlightPlanStore, ttl: number, clockValue: clock.Clock): WeightedFlightPlanStore {
  return new CachedWeightedFlightPlanStore(inner, cache.newTtlCache<WeightedFlightPlan>(512, ttl, clockValue), 0, 0);
}

/** Selects weighted flight plans. Empty fields match all. */
export class WeightedFlightPlanQuery {
  region: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minVersion: number, statuses: string[], limit: number) {
    this.region = region;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedFlightPlan): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedFlightPlan[]): WeightedFlightPlan[] {
    const matched = collections.filter(items, (candidate: WeightedFlightPlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedFlightPlans(store: WeightedFlightPlanStore, query: WeightedFlightPlanQuery): WeightedFlightPlan[] {
  return query.apply(store.list());
}
