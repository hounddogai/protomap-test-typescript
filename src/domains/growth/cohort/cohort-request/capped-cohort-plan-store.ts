import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedCohortPlan } from "./capped-cohort-plan.js";

/** Keeps capped cohort plans by code. */
export interface CappedCohortPlanStore {
  find(code: string): CappedCohortPlan | undefined;
  save(item: CappedCohortPlan): void;
  remove(code: string): boolean;
  list(): CappedCohortPlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedCohortPlanStore implements CappedCohortPlanStore {
  items: Map<string, CappedCohortPlan>;
  order: string[];

  constructor(items: Map<string, CappedCohortPlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedCohortPlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedCohortPlan): void {
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

  list(): CappedCohortPlan[] {
    const out: CappedCohortPlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedCohortPlanStore(): CappedCohortPlanStore {
  return new MemoryCappedCohortPlanStore(new Map<string, CappedCohortPlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedCohortPlanStore implements CappedCohortPlanStore {
  inner: CappedCohortPlanStore;
  cache: cache.TtlCache<CappedCohortPlan>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedCohortPlanStore,
    cacheValue: cache.TtlCache<CappedCohortPlan>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedCohortPlan | undefined {
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

  save(item: CappedCohortPlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedCohortPlan[] {
    return this.inner.list();
  }
}

export function newCachedCappedCohortPlanStore(inner: CappedCohortPlanStore, ttl: number, clockValue: clock.Clock): CappedCohortPlanStore {
  return new CachedCappedCohortPlanStore(inner, cache.newTtlCache<CappedCohortPlan>(128, ttl, clockValue), 0, 0);
}

/** Selects capped cohort plans. Empty fields match all. */
export class CappedCohortPlanQuery {
  country: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minRetries: number, statuses: string[], limit: number) {
    this.country = country;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedCohortPlan): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedCohortPlan[]): CappedCohortPlan[] {
    const matched = collections.filter(items, (candidate: CappedCohortPlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedCohortPlans(store: CappedCohortPlanStore, query: CappedCohortPlanQuery): CappedCohortPlan[] {
  return query.apply(store.list());
}
