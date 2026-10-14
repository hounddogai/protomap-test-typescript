import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SubscriptionPlan } from "./subscription-plan.js";

/** Keeps subscription plans by code. */
export interface SubscriptionPlanStore {
  find(code: string): SubscriptionPlan | undefined;
  save(item: SubscriptionPlan): void;
  remove(code: string): boolean;
  list(): SubscriptionPlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySubscriptionPlanStore implements SubscriptionPlanStore {
  items: Map<string, SubscriptionPlan>;
  order: string[];

  constructor(items: Map<string, SubscriptionPlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SubscriptionPlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SubscriptionPlan): void {
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

  list(): SubscriptionPlan[] {
    const out: SubscriptionPlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySubscriptionPlanStore(): SubscriptionPlanStore {
  return new MemorySubscriptionPlanStore(new Map<string, SubscriptionPlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSubscriptionPlanStore implements SubscriptionPlanStore {
  inner: SubscriptionPlanStore;
  cache: cache.TtlCache<SubscriptionPlan>;
  hits: number;
  misses: number;

  constructor(
    inner: SubscriptionPlanStore,
    cacheValue: cache.TtlCache<SubscriptionPlan>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SubscriptionPlan | undefined {
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

  save(item: SubscriptionPlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SubscriptionPlan[] {
    return this.inner.list();
  }
}

export function newCachedSubscriptionPlanStore(inner: SubscriptionPlanStore, ttl: number, clockValue: clock.Clock): SubscriptionPlanStore {
  return new CachedSubscriptionPlanStore(inner, cache.newTtlCache<SubscriptionPlan>(64, ttl, clockValue), 0, 0);
}

/** Selects subscription plans. Empty fields match all. */
export class SubscriptionPlanQuery {
  name: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minCost: number, statuses: string[], limit: number) {
    this.name = name;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SubscriptionPlan): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SubscriptionPlan[]): SubscriptionPlan[] {
    const matched = collections.filter(items, (candidate: SubscriptionPlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSubscriptionPlans(store: SubscriptionPlanStore, query: SubscriptionPlanQuery): SubscriptionPlan[] {
  return query.apply(store.list());
}
