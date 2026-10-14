import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SuppressionPlan } from "./suppression-plan.js";

/** Keeps suppression plans by code. */
export interface SuppressionPlanStore {
  find(code: string): SuppressionPlan | undefined;
  save(item: SuppressionPlan): void;
  remove(code: string): boolean;
  list(): SuppressionPlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySuppressionPlanStore implements SuppressionPlanStore {
  items: Map<string, SuppressionPlan>;
  order: string[];

  constructor(items: Map<string, SuppressionPlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SuppressionPlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SuppressionPlan): void {
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

  list(): SuppressionPlan[] {
    const out: SuppressionPlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySuppressionPlanStore(): SuppressionPlanStore {
  return new MemorySuppressionPlanStore(new Map<string, SuppressionPlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSuppressionPlanStore implements SuppressionPlanStore {
  inner: SuppressionPlanStore;
  cache: cache.TtlCache<SuppressionPlan>;
  hits: number;
  misses: number;

  constructor(
    inner: SuppressionPlanStore,
    cacheValue: cache.TtlCache<SuppressionPlan>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SuppressionPlan | undefined {
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

  save(item: SuppressionPlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SuppressionPlan[] {
    return this.inner.list();
  }
}

export function newCachedSuppressionPlanStore(inner: SuppressionPlanStore, ttl: number, clockValue: clock.Clock): SuppressionPlanStore {
  return new CachedSuppressionPlanStore(inner, cache.newTtlCache<SuppressionPlan>(512, ttl, clockValue), 0, 0);
}

/** Selects suppression plans. Empty fields match all. */
export class SuppressionPlanQuery {
  locale: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minBudget: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SuppressionPlan): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SuppressionPlan[]): SuppressionPlan[] {
    const matched = collections.filter(items, (candidate: SuppressionPlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSuppressionPlans(store: SuppressionPlanStore, query: SuppressionPlanQuery): SuppressionPlan[] {
  return query.apply(store.list());
}
