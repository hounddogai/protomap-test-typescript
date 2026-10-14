import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedRewardRuleEstimate } from "./batched-reward-rule-estimate.js";

/** Keeps batched reward rule estimates by code. */
export interface BatchedRewardRuleEstimateStore {
  find(code: string): BatchedRewardRuleEstimate | undefined;
  save(item: BatchedRewardRuleEstimate): void;
  remove(code: string): boolean;
  list(): BatchedRewardRuleEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedRewardRuleEstimateStore implements BatchedRewardRuleEstimateStore {
  items: Map<string, BatchedRewardRuleEstimate>;
  order: string[];

  constructor(items: Map<string, BatchedRewardRuleEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedRewardRuleEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedRewardRuleEstimate): void {
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

  list(): BatchedRewardRuleEstimate[] {
    const out: BatchedRewardRuleEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedRewardRuleEstimateStore(): BatchedRewardRuleEstimateStore {
  return new MemoryBatchedRewardRuleEstimateStore(new Map<string, BatchedRewardRuleEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedRewardRuleEstimateStore implements BatchedRewardRuleEstimateStore {
  inner: BatchedRewardRuleEstimateStore;
  cache: cache.TtlCache<BatchedRewardRuleEstimate>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedRewardRuleEstimateStore,
    cacheValue: cache.TtlCache<BatchedRewardRuleEstimate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedRewardRuleEstimate | undefined {
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

  save(item: BatchedRewardRuleEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedRewardRuleEstimate[] {
    return this.inner.list();
  }
}

export function newCachedBatchedRewardRuleEstimateStore(inner: BatchedRewardRuleEstimateStore, ttl: number, clockValue: clock.Clock): BatchedRewardRuleEstimateStore {
  return new CachedBatchedRewardRuleEstimateStore(
    inner,
    cache.newTtlCache<BatchedRewardRuleEstimate>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched reward rule estimates. Empty fields match all. */
export class BatchedRewardRuleEstimateQuery {
  label: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minEndsAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedRewardRuleEstimate): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedRewardRuleEstimate[]): BatchedRewardRuleEstimate[] {
    const matched = collections.filter(items, (candidate: BatchedRewardRuleEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedRewardRuleEstimates(store: BatchedRewardRuleEstimateStore, query: BatchedRewardRuleEstimateQuery): BatchedRewardRuleEstimate[] {
  return query.apply(store.list());
}
