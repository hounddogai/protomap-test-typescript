import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackBranchPlan } from "./fallback-branch-plan.js";

/** Keeps fallback branch plans by code. */
export interface FallbackBranchPlanStore {
  find(code: string): FallbackBranchPlan | undefined;
  save(item: FallbackBranchPlan): void;
  remove(code: string): boolean;
  list(): FallbackBranchPlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackBranchPlanStore implements FallbackBranchPlanStore {
  items: Map<string, FallbackBranchPlan>;
  order: string[];

  constructor(items: Map<string, FallbackBranchPlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackBranchPlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackBranchPlan): void {
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

  list(): FallbackBranchPlan[] {
    const out: FallbackBranchPlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackBranchPlanStore(): FallbackBranchPlanStore {
  return new MemoryFallbackBranchPlanStore(new Map<string, FallbackBranchPlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackBranchPlanStore implements FallbackBranchPlanStore {
  inner: FallbackBranchPlanStore;
  cache: cache.TtlCache<FallbackBranchPlan>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackBranchPlanStore,
    cacheValue: cache.TtlCache<FallbackBranchPlan>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackBranchPlan | undefined {
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

  save(item: FallbackBranchPlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackBranchPlan[] {
    return this.inner.list();
  }
}

export function newCachedFallbackBranchPlanStore(inner: FallbackBranchPlanStore, ttl: number, clockValue: clock.Clock): FallbackBranchPlanStore {
  return new CachedFallbackBranchPlanStore(inner, cache.newTtlCache<FallbackBranchPlan>(1024, ttl, clockValue), 0, 0);
}

/** Selects fallback branch plans. Empty fields match all. */
export class FallbackBranchPlanQuery {
  segment: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minPriority: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackBranchPlan): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackBranchPlan[]): FallbackBranchPlan[] {
    const matched = collections.filter(items, (candidate: FallbackBranchPlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackBranchPlans(store: FallbackBranchPlanStore, query: FallbackBranchPlanQuery): FallbackBranchPlan[] {
  return query.apply(store.list());
}
