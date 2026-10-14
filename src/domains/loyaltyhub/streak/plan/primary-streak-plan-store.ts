import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryStreakPlan } from "./primary-streak-plan.js";

/** Keeps primary streak plans by code. */
export interface PrimaryStreakPlanStore {
  find(code: string): PrimaryStreakPlan | undefined;
  save(item: PrimaryStreakPlan): void;
  remove(code: string): boolean;
  list(): PrimaryStreakPlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryStreakPlanStore implements PrimaryStreakPlanStore {
  items: Map<string, PrimaryStreakPlan>;
  order: string[];

  constructor(items: Map<string, PrimaryStreakPlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryStreakPlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryStreakPlan): void {
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

  list(): PrimaryStreakPlan[] {
    const out: PrimaryStreakPlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryStreakPlanStore(): PrimaryStreakPlanStore {
  return new MemoryPrimaryStreakPlanStore(new Map<string, PrimaryStreakPlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryStreakPlanStore implements PrimaryStreakPlanStore {
  inner: PrimaryStreakPlanStore;
  cache: cache.TtlCache<PrimaryStreakPlan>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryStreakPlanStore,
    cacheValue: cache.TtlCache<PrimaryStreakPlan>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryStreakPlan | undefined {
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

  save(item: PrimaryStreakPlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryStreakPlan[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryStreakPlanStore(inner: PrimaryStreakPlanStore, ttl: number, clockValue: clock.Clock): PrimaryStreakPlanStore {
  return new CachedPrimaryStreakPlanStore(inner, cache.newTtlCache<PrimaryStreakPlan>(64, ttl, clockValue), 0, 0);
}

/** Selects primary streak plans. Empty fields match all. */
export class PrimaryStreakPlanQuery {
  category: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.category = category;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryStreakPlan): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryStreakPlan[]): PrimaryStreakPlan[] {
    const matched = collections.filter(items, (candidate: PrimaryStreakPlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryStreakPlans(store: PrimaryStreakPlanStore, query: PrimaryStreakPlanQuery): PrimaryStreakPlan[] {
  return query.apply(store.list());
}
