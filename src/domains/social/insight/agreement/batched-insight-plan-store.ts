import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedInsightPlan } from "./batched-insight-plan.js";

/** Keeps batched insight plans by code. */
export interface BatchedInsightPlanStore {
  find(code: string): BatchedInsightPlan | undefined;
  save(item: BatchedInsightPlan): void;
  remove(code: string): boolean;
  list(): BatchedInsightPlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedInsightPlanStore implements BatchedInsightPlanStore {
  items: Map<string, BatchedInsightPlan>;
  order: string[];

  constructor(items: Map<string, BatchedInsightPlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedInsightPlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedInsightPlan): void {
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

  list(): BatchedInsightPlan[] {
    const out: BatchedInsightPlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedInsightPlanStore(): BatchedInsightPlanStore {
  return new MemoryBatchedInsightPlanStore(new Map<string, BatchedInsightPlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedInsightPlanStore implements BatchedInsightPlanStore {
  inner: BatchedInsightPlanStore;
  cache: cache.TtlCache<BatchedInsightPlan>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedInsightPlanStore,
    cacheValue: cache.TtlCache<BatchedInsightPlan>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedInsightPlan | undefined {
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

  save(item: BatchedInsightPlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedInsightPlan[] {
    return this.inner.list();
  }
}

export function newCachedBatchedInsightPlanStore(inner: BatchedInsightPlanStore, ttl: number, clockValue: clock.Clock): BatchedInsightPlanStore {
  return new CachedBatchedInsightPlanStore(inner, cache.newTtlCache<BatchedInsightPlan>(512, ttl, clockValue), 0, 0);
}

/** Selects batched insight plans. Empty fields match all. */
export class BatchedInsightPlanQuery {
  locale: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minAmount: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedInsightPlan): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedInsightPlan[]): BatchedInsightPlan[] {
    const matched = collections.filter(items, (candidate: BatchedInsightPlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedInsightPlans(store: BatchedInsightPlanStore, query: BatchedInsightPlanQuery): BatchedInsightPlan[] {
  return query.apply(store.list());
}
