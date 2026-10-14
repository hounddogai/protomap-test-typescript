import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedPayoutBudget } from "./weighted-payout-budget.js";

/** Keeps weighted payout budgets by code. */
export interface WeightedPayoutBudgetStore {
  find(code: string): WeightedPayoutBudget | undefined;
  save(item: WeightedPayoutBudget): void;
  remove(code: string): boolean;
  list(): WeightedPayoutBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedPayoutBudgetStore implements WeightedPayoutBudgetStore {
  items: Map<string, WeightedPayoutBudget>;
  order: string[];

  constructor(items: Map<string, WeightedPayoutBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedPayoutBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedPayoutBudget): void {
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

  list(): WeightedPayoutBudget[] {
    const out: WeightedPayoutBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedPayoutBudgetStore(): WeightedPayoutBudgetStore {
  return new MemoryWeightedPayoutBudgetStore(new Map<string, WeightedPayoutBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedPayoutBudgetStore implements WeightedPayoutBudgetStore {
  inner: WeightedPayoutBudgetStore;
  cache: cache.TtlCache<WeightedPayoutBudget>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedPayoutBudgetStore,
    cacheValue: cache.TtlCache<WeightedPayoutBudget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedPayoutBudget | undefined {
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

  save(item: WeightedPayoutBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedPayoutBudget[] {
    return this.inner.list();
  }
}

export function newCachedWeightedPayoutBudgetStore(inner: WeightedPayoutBudgetStore, ttl: number, clockValue: clock.Clock): WeightedPayoutBudgetStore {
  return new CachedWeightedPayoutBudgetStore(
    inner,
    cache.newTtlCache<WeightedPayoutBudget>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted payout budgets. Empty fields match all. */
export class WeightedPayoutBudgetQuery {
  category: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minDiscount: number, statuses: string[], limit: number) {
    this.category = category;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedPayoutBudget): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedPayoutBudget[]): WeightedPayoutBudget[] {
    const matched = collections.filter(items, (candidate: WeightedPayoutBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedPayoutBudgets(store: WeightedPayoutBudgetStore, query: WeightedPayoutBudgetQuery): WeightedPayoutBudget[] {
  return query.apply(store.list());
}
