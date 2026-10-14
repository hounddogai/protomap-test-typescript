import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedRewardRuleBudget } from "./weighted-reward-rule-budget.js";

/** Keeps weighted reward rule budgets by code. */
export interface WeightedRewardRuleBudgetStore {
  find(code: string): WeightedRewardRuleBudget | undefined;
  save(item: WeightedRewardRuleBudget): void;
  remove(code: string): boolean;
  list(): WeightedRewardRuleBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedRewardRuleBudgetStore implements WeightedRewardRuleBudgetStore {
  items: Map<string, WeightedRewardRuleBudget>;
  order: string[];

  constructor(items: Map<string, WeightedRewardRuleBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedRewardRuleBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedRewardRuleBudget): void {
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

  list(): WeightedRewardRuleBudget[] {
    const out: WeightedRewardRuleBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedRewardRuleBudgetStore(): WeightedRewardRuleBudgetStore {
  return new MemoryWeightedRewardRuleBudgetStore(new Map<string, WeightedRewardRuleBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedRewardRuleBudgetStore implements WeightedRewardRuleBudgetStore {
  inner: WeightedRewardRuleBudgetStore;
  cache: cache.TtlCache<WeightedRewardRuleBudget>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedRewardRuleBudgetStore,
    cacheValue: cache.TtlCache<WeightedRewardRuleBudget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedRewardRuleBudget | undefined {
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

  save(item: WeightedRewardRuleBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedRewardRuleBudget[] {
    return this.inner.list();
  }
}

export function newCachedWeightedRewardRuleBudgetStore(inner: WeightedRewardRuleBudgetStore, ttl: number, clockValue: clock.Clock): WeightedRewardRuleBudgetStore {
  return new CachedWeightedRewardRuleBudgetStore(
    inner,
    cache.newTtlCache<WeightedRewardRuleBudget>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted reward rule budgets. Empty fields match all. */
export class WeightedRewardRuleBudgetQuery {
  country: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minRevision: number, statuses: string[], limit: number) {
    this.country = country;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedRewardRuleBudget): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedRewardRuleBudget[]): WeightedRewardRuleBudget[] {
    const matched = collections.filter(items, (candidate: WeightedRewardRuleBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedRewardRuleBudgets(store: WeightedRewardRuleBudgetStore, query: WeightedRewardRuleBudgetQuery): WeightedRewardRuleBudget[] {
  return query.apply(store.list());
}
