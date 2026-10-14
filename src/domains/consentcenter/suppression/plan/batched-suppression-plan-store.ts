import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedSuppressionPlan } from "./batched-suppression-plan.js";

/** Keeps batched suppression plans by code. */
export interface BatchedSuppressionPlanStore {
  find(code: string): BatchedSuppressionPlan | undefined;
  save(item: BatchedSuppressionPlan): void;
  remove(code: string): boolean;
  list(): BatchedSuppressionPlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedSuppressionPlanStore implements BatchedSuppressionPlanStore {
  items: Map<string, BatchedSuppressionPlan>;
  order: string[];

  constructor(items: Map<string, BatchedSuppressionPlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedSuppressionPlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedSuppressionPlan): void {
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

  list(): BatchedSuppressionPlan[] {
    const out: BatchedSuppressionPlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedSuppressionPlanStore(): BatchedSuppressionPlanStore {
  return new MemoryBatchedSuppressionPlanStore(new Map<string, BatchedSuppressionPlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedSuppressionPlanStore implements BatchedSuppressionPlanStore {
  inner: BatchedSuppressionPlanStore;
  cache: cache.TtlCache<BatchedSuppressionPlan>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedSuppressionPlanStore,
    cacheValue: cache.TtlCache<BatchedSuppressionPlan>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedSuppressionPlan | undefined {
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

  save(item: BatchedSuppressionPlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedSuppressionPlan[] {
    return this.inner.list();
  }
}

export function newCachedBatchedSuppressionPlanStore(inner: BatchedSuppressionPlanStore, ttl: number, clockValue: clock.Clock): BatchedSuppressionPlanStore {
  return new CachedBatchedSuppressionPlanStore(
    inner,
    cache.newTtlCache<BatchedSuppressionPlan>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched suppression plans. Empty fields match all. */
export class BatchedSuppressionPlanQuery {
  region: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minFloorValue: number, statuses: string[], limit: number) {
    this.region = region;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedSuppressionPlan): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedSuppressionPlan[]): BatchedSuppressionPlan[] {
    const matched = collections.filter(items, (candidate: BatchedSuppressionPlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedSuppressionPlans(store: BatchedSuppressionPlanStore, query: BatchedSuppressionPlanQuery): BatchedSuppressionPlan[] {
  return query.apply(store.list());
}
