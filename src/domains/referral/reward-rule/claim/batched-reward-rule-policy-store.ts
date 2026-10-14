import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedRewardRulePolicy } from "./batched-reward-rule-policy.js";

/** Keeps batched reward rule policies by code. */
export interface BatchedRewardRulePolicyStore {
  find(code: string): BatchedRewardRulePolicy | undefined;
  save(item: BatchedRewardRulePolicy): void;
  remove(code: string): boolean;
  list(): BatchedRewardRulePolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedRewardRulePolicyStore implements BatchedRewardRulePolicyStore {
  items: Map<string, BatchedRewardRulePolicy>;
  order: string[];

  constructor(items: Map<string, BatchedRewardRulePolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedRewardRulePolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedRewardRulePolicy): void {
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

  list(): BatchedRewardRulePolicy[] {
    const out: BatchedRewardRulePolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedRewardRulePolicyStore(): BatchedRewardRulePolicyStore {
  return new MemoryBatchedRewardRulePolicyStore(new Map<string, BatchedRewardRulePolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedRewardRulePolicyStore implements BatchedRewardRulePolicyStore {
  inner: BatchedRewardRulePolicyStore;
  cache: cache.TtlCache<BatchedRewardRulePolicy>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedRewardRulePolicyStore,
    cacheValue: cache.TtlCache<BatchedRewardRulePolicy>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedRewardRulePolicy | undefined {
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

  save(item: BatchedRewardRulePolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedRewardRulePolicy[] {
    return this.inner.list();
  }
}

export function newCachedBatchedRewardRulePolicyStore(inner: BatchedRewardRulePolicyStore, ttl: number, clockValue: clock.Clock): BatchedRewardRulePolicyStore {
  return new CachedBatchedRewardRulePolicyStore(
    inner,
    cache.newTtlCache<BatchedRewardRulePolicy>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched reward rule policies. Empty fields match all. */
export class BatchedRewardRulePolicyQuery {
  category: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minFloorValue: number, statuses: string[], limit: number) {
    this.category = category;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedRewardRulePolicy): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedRewardRulePolicy[]): BatchedRewardRulePolicy[] {
    const matched = collections.filter(items, (candidate: BatchedRewardRulePolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedRewardRulePolicies(store: BatchedRewardRulePolicyStore, query: BatchedRewardRulePolicyQuery): BatchedRewardRulePolicy[] {
  return query.apply(store.list());
}
