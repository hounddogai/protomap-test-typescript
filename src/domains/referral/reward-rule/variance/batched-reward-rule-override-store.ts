import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedRewardRuleOverride } from "./batched-reward-rule-override.js";

/** Keeps batched reward rule overrides by code. */
export interface BatchedRewardRuleOverrideStore {
  find(code: string): BatchedRewardRuleOverride | undefined;
  save(item: BatchedRewardRuleOverride): void;
  remove(code: string): boolean;
  list(): BatchedRewardRuleOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedRewardRuleOverrideStore implements BatchedRewardRuleOverrideStore {
  items: Map<string, BatchedRewardRuleOverride>;
  order: string[];

  constructor(items: Map<string, BatchedRewardRuleOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedRewardRuleOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedRewardRuleOverride): void {
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

  list(): BatchedRewardRuleOverride[] {
    const out: BatchedRewardRuleOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedRewardRuleOverrideStore(): BatchedRewardRuleOverrideStore {
  return new MemoryBatchedRewardRuleOverrideStore(new Map<string, BatchedRewardRuleOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedRewardRuleOverrideStore implements BatchedRewardRuleOverrideStore {
  inner: BatchedRewardRuleOverrideStore;
  cache: cache.TtlCache<BatchedRewardRuleOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedRewardRuleOverrideStore,
    cacheValue: cache.TtlCache<BatchedRewardRuleOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedRewardRuleOverride | undefined {
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

  save(item: BatchedRewardRuleOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedRewardRuleOverride[] {
    return this.inner.list();
  }
}

export function newCachedBatchedRewardRuleOverrideStore(inner: BatchedRewardRuleOverrideStore, ttl: number, clockValue: clock.Clock): BatchedRewardRuleOverrideStore {
  return new CachedBatchedRewardRuleOverrideStore(
    inner,
    cache.newTtlCache<BatchedRewardRuleOverride>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched reward rule overrides. Empty fields match all. */
export class BatchedRewardRuleOverrideQuery {
  category: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minOpenRate: number, statuses: string[], limit: number) {
    this.category = category;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedRewardRuleOverride): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedRewardRuleOverride[]): BatchedRewardRuleOverride[] {
    const matched = collections.filter(items, (candidate: BatchedRewardRuleOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedRewardRuleOverrides(store: BatchedRewardRuleOverrideStore, query: BatchedRewardRuleOverrideQuery): BatchedRewardRuleOverride[] {
  return query.apply(store.list());
}
