import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedDoubleOptInPlan } from "./batched-double-opt-in-plan.js";

/** Keeps batched double opt in plans by code. */
export interface BatchedDoubleOptInPlanStore {
  find(code: string): BatchedDoubleOptInPlan | undefined;
  save(item: BatchedDoubleOptInPlan): void;
  remove(code: string): boolean;
  list(): BatchedDoubleOptInPlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedDoubleOptInPlanStore implements BatchedDoubleOptInPlanStore {
  items: Map<string, BatchedDoubleOptInPlan>;
  order: string[];

  constructor(items: Map<string, BatchedDoubleOptInPlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedDoubleOptInPlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedDoubleOptInPlan): void {
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

  list(): BatchedDoubleOptInPlan[] {
    const out: BatchedDoubleOptInPlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedDoubleOptInPlanStore(): BatchedDoubleOptInPlanStore {
  return new MemoryBatchedDoubleOptInPlanStore(new Map<string, BatchedDoubleOptInPlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedDoubleOptInPlanStore implements BatchedDoubleOptInPlanStore {
  inner: BatchedDoubleOptInPlanStore;
  cache: cache.TtlCache<BatchedDoubleOptInPlan>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedDoubleOptInPlanStore,
    cacheValue: cache.TtlCache<BatchedDoubleOptInPlan>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedDoubleOptInPlan | undefined {
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

  save(item: BatchedDoubleOptInPlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedDoubleOptInPlan[] {
    return this.inner.list();
  }
}

export function newCachedBatchedDoubleOptInPlanStore(inner: BatchedDoubleOptInPlanStore, ttl: number, clockValue: clock.Clock): BatchedDoubleOptInPlanStore {
  return new CachedBatchedDoubleOptInPlanStore(
    inner,
    cache.newTtlCache<BatchedDoubleOptInPlan>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched double opt in plans. Empty fields match all. */
export class BatchedDoubleOptInPlanQuery {
  segment: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minConversionRate: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedDoubleOptInPlan): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedDoubleOptInPlan[]): BatchedDoubleOptInPlan[] {
    const matched = collections.filter(items, (candidate: BatchedDoubleOptInPlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedDoubleOptInPlans(store: BatchedDoubleOptInPlanStore, query: BatchedDoubleOptInPlanQuery): BatchedDoubleOptInPlan[] {
  return query.apply(store.list());
}
