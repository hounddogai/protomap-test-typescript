import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StepPlan } from "./step-plan.js";

/** Keeps step plans by code. */
export interface StepPlanStore {
  find(code: string): StepPlan | undefined;
  save(item: StepPlan): void;
  remove(code: string): boolean;
  list(): StepPlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStepPlanStore implements StepPlanStore {
  items: Map<string, StepPlan>;
  order: string[];

  constructor(items: Map<string, StepPlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StepPlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StepPlan): void {
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

  list(): StepPlan[] {
    const out: StepPlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStepPlanStore(): StepPlanStore {
  return new MemoryStepPlanStore(new Map<string, StepPlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStepPlanStore implements StepPlanStore {
  inner: StepPlanStore;
  cache: cache.TtlCache<StepPlan>;
  hits: number;
  misses: number;

  constructor(inner: StepPlanStore, cacheValue: cache.TtlCache<StepPlan>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StepPlan | undefined {
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

  save(item: StepPlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StepPlan[] {
    return this.inner.list();
  }
}

export function newCachedStepPlanStore(inner: StepPlanStore, ttl: number, clockValue: clock.Clock): StepPlanStore {
  return new CachedStepPlanStore(inner, cache.newTtlCache<StepPlan>(64, ttl, clockValue), 0, 0);
}

/** Selects step plans. Empty fields match all. */
export class StepPlanQuery {
  region: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minImpressions: number, statuses: string[], limit: number) {
    this.region = region;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StepPlan): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StepPlan[]): StepPlan[] {
    const matched = collections.filter(items, (candidate: StepPlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStepPlans(store: StepPlanStore, query: StepPlanQuery): StepPlan[] {
  return query.apply(store.list());
}
