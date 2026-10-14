import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedRewardRule } from "./batched-reward-rule.js";

/** Keeps batched reward rules by code. */
export interface BatchedRewardRuleStore {
  find(code: string): BatchedRewardRule | undefined;
  save(item: BatchedRewardRule): void;
  remove(code: string): boolean;
  list(): BatchedRewardRule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedRewardRuleStore implements BatchedRewardRuleStore {
  items: Map<string, BatchedRewardRule>;
  order: string[];

  constructor(items: Map<string, BatchedRewardRule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedRewardRule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedRewardRule): void {
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

  list(): BatchedRewardRule[] {
    const out: BatchedRewardRule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedRewardRuleStore(): BatchedRewardRuleStore {
  return new MemoryBatchedRewardRuleStore(new Map<string, BatchedRewardRule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedRewardRuleStore implements BatchedRewardRuleStore {
  inner: BatchedRewardRuleStore;
  cache: cache.TtlCache<BatchedRewardRule>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedRewardRuleStore,
    cacheValue: cache.TtlCache<BatchedRewardRule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedRewardRule | undefined {
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

  save(item: BatchedRewardRule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedRewardRule[] {
    return this.inner.list();
  }
}

export function newCachedBatchedRewardRuleStore(inner: BatchedRewardRuleStore, ttl: number, clockValue: clock.Clock): BatchedRewardRuleStore {
  return new CachedBatchedRewardRuleStore(inner, cache.newTtlCache<BatchedRewardRule>(256, ttl, clockValue), 0, 0);
}

/** Selects batched reward rules. Empty fields match all. */
export class BatchedRewardRuleQuery {
  locale: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minSendAt: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedRewardRule): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedRewardRule[]): BatchedRewardRule[] {
    const matched = collections.filter(items, (candidate: BatchedRewardRule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedRewardRules(store: BatchedRewardRuleStore, query: BatchedRewardRuleQuery): BatchedRewardRule[] {
  return query.apply(store.list());
}
