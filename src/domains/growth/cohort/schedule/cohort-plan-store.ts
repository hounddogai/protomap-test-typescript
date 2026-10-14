import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CohortPlan } from "./cohort-plan.js";

/** Keeps cohort plans by code. */
export interface CohortPlanStore {
  find(code: string): CohortPlan | undefined;
  save(item: CohortPlan): void;
  remove(code: string): boolean;
  list(): CohortPlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCohortPlanStore implements CohortPlanStore {
  items: Map<string, CohortPlan>;
  order: string[];

  constructor(items: Map<string, CohortPlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CohortPlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CohortPlan): void {
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

  list(): CohortPlan[] {
    const out: CohortPlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCohortPlanStore(): CohortPlanStore {
  return new MemoryCohortPlanStore(new Map<string, CohortPlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCohortPlanStore implements CohortPlanStore {
  inner: CohortPlanStore;
  cache: cache.TtlCache<CohortPlan>;
  hits: number;
  misses: number;

  constructor(inner: CohortPlanStore, cacheValue: cache.TtlCache<CohortPlan>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CohortPlan | undefined {
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

  save(item: CohortPlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CohortPlan[] {
    return this.inner.list();
  }
}

export function newCachedCohortPlanStore(inner: CohortPlanStore, ttl: number, clockValue: clock.Clock): CohortPlanStore {
  return new CachedCohortPlanStore(inner, cache.newTtlCache<CohortPlan>(1024, ttl, clockValue), 0, 0);
}

/** Selects cohort plans. Empty fields match all. */
export class CohortPlanQuery {
  source: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minWindowDays: number, statuses: string[], limit: number) {
    this.source = source;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CohortPlan): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CohortPlan[]): CohortPlan[] {
    const matched = collections.filter(items, (candidate: CohortPlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCohortPlans(store: CohortPlanStore, query: CohortPlanQuery): CohortPlan[] {
  return query.apply(store.list());
}
