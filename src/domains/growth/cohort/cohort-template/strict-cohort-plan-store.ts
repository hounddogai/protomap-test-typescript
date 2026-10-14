import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictCohortPlan } from "./strict-cohort-plan.js";

/** Keeps strict cohort plans by code. */
export interface StrictCohortPlanStore {
  find(code: string): StrictCohortPlan | undefined;
  save(item: StrictCohortPlan): void;
  remove(code: string): boolean;
  list(): StrictCohortPlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictCohortPlanStore implements StrictCohortPlanStore {
  items: Map<string, StrictCohortPlan>;
  order: string[];

  constructor(items: Map<string, StrictCohortPlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictCohortPlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictCohortPlan): void {
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

  list(): StrictCohortPlan[] {
    const out: StrictCohortPlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictCohortPlanStore(): StrictCohortPlanStore {
  return new MemoryStrictCohortPlanStore(new Map<string, StrictCohortPlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictCohortPlanStore implements StrictCohortPlanStore {
  inner: StrictCohortPlanStore;
  cache: cache.TtlCache<StrictCohortPlan>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictCohortPlanStore,
    cacheValue: cache.TtlCache<StrictCohortPlan>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictCohortPlan | undefined {
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

  save(item: StrictCohortPlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictCohortPlan[] {
    return this.inner.list();
  }
}

export function newCachedStrictCohortPlanStore(inner: StrictCohortPlanStore, ttl: number, clockValue: clock.Clock): StrictCohortPlanStore {
  return new CachedStrictCohortPlanStore(inner, cache.newTtlCache<StrictCohortPlan>(256, ttl, clockValue), 0, 0);
}

/** Selects strict cohort plans. Empty fields match all. */
export class StrictCohortPlanQuery {
  locale: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minWeight: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictCohortPlan): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictCohortPlan[]): StrictCohortPlan[] {
    const matched = collections.filter(items, (candidate: StrictCohortPlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictCohortPlans(store: StrictCohortPlanStore, query: StrictCohortPlanQuery): StrictCohortPlan[] {
  return query.apply(store.list());
}
