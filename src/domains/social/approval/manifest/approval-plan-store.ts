import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ApprovalPlan } from "./approval-plan.js";

/** Keeps approval plans by code. */
export interface ApprovalPlanStore {
  find(code: string): ApprovalPlan | undefined;
  save(item: ApprovalPlan): void;
  remove(code: string): boolean;
  list(): ApprovalPlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryApprovalPlanStore implements ApprovalPlanStore {
  items: Map<string, ApprovalPlan>;
  order: string[];

  constructor(items: Map<string, ApprovalPlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ApprovalPlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ApprovalPlan): void {
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

  list(): ApprovalPlan[] {
    const out: ApprovalPlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryApprovalPlanStore(): ApprovalPlanStore {
  return new MemoryApprovalPlanStore(new Map<string, ApprovalPlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedApprovalPlanStore implements ApprovalPlanStore {
  inner: ApprovalPlanStore;
  cache: cache.TtlCache<ApprovalPlan>;
  hits: number;
  misses: number;

  constructor(inner: ApprovalPlanStore, cacheValue: cache.TtlCache<ApprovalPlan>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ApprovalPlan | undefined {
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

  save(item: ApprovalPlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ApprovalPlan[] {
    return this.inner.list();
  }
}

export function newCachedApprovalPlanStore(inner: ApprovalPlanStore, ttl: number, clockValue: clock.Clock): ApprovalPlanStore {
  return new CachedApprovalPlanStore(inner, cache.newTtlCache<ApprovalPlan>(512, ttl, clockValue), 0, 0);
}

/** Selects approval plans. Empty fields match all. */
export class ApprovalPlanQuery {
  title: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minCost: number, statuses: string[], limit: number) {
    this.title = title;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ApprovalPlan): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ApprovalPlan[]): ApprovalPlan[] {
    const matched = collections.filter(items, (candidate: ApprovalPlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findApprovalPlans(store: ApprovalPlanStore, query: ApprovalPlanQuery): ApprovalPlan[] {
  return query.apply(store.list());
}
