import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalRewardRuleThreshold } from "./global-reward-rule-threshold.js";

/** Keeps global reward rule thresholds by code. */
export interface GlobalRewardRuleThresholdStore {
  find(code: string): GlobalRewardRuleThreshold | undefined;
  save(item: GlobalRewardRuleThreshold): void;
  remove(code: string): boolean;
  list(): GlobalRewardRuleThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalRewardRuleThresholdStore implements GlobalRewardRuleThresholdStore {
  items: Map<string, GlobalRewardRuleThreshold>;
  order: string[];

  constructor(items: Map<string, GlobalRewardRuleThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalRewardRuleThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalRewardRuleThreshold): void {
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

  list(): GlobalRewardRuleThreshold[] {
    const out: GlobalRewardRuleThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalRewardRuleThresholdStore(): GlobalRewardRuleThresholdStore {
  return new MemoryGlobalRewardRuleThresholdStore(new Map<string, GlobalRewardRuleThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalRewardRuleThresholdStore implements GlobalRewardRuleThresholdStore {
  inner: GlobalRewardRuleThresholdStore;
  cache: cache.TtlCache<GlobalRewardRuleThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalRewardRuleThresholdStore,
    cacheValue: cache.TtlCache<GlobalRewardRuleThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalRewardRuleThreshold | undefined {
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

  save(item: GlobalRewardRuleThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalRewardRuleThreshold[] {
    return this.inner.list();
  }
}

export function newCachedGlobalRewardRuleThresholdStore(inner: GlobalRewardRuleThresholdStore, ttl: number, clockValue: clock.Clock): GlobalRewardRuleThresholdStore {
  return new CachedGlobalRewardRuleThresholdStore(
    inner,
    cache.newTtlCache<GlobalRewardRuleThreshold>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects global reward rule thresholds. Empty fields match all. */
export class GlobalRewardRuleThresholdQuery {
  category: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minBudget: number, statuses: string[], limit: number) {
    this.category = category;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalRewardRuleThreshold): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalRewardRuleThreshold[]): GlobalRewardRuleThreshold[] {
    const matched = collections.filter(items, (candidate: GlobalRewardRuleThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalRewardRuleThresholds(store: GlobalRewardRuleThresholdStore, query: GlobalRewardRuleThresholdQuery): GlobalRewardRuleThreshold[] {
  return query.apply(store.list());
}
