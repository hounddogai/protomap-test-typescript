import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveCreditBudget } from "./adaptive-credit-budget.js";

/** Keeps adaptive credit budgets by code. */
export interface AdaptiveCreditBudgetStore {
  find(code: string): AdaptiveCreditBudget | undefined;
  save(item: AdaptiveCreditBudget): void;
  remove(code: string): boolean;
  list(): AdaptiveCreditBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveCreditBudgetStore implements AdaptiveCreditBudgetStore {
  items: Map<string, AdaptiveCreditBudget>;
  order: string[];

  constructor(items: Map<string, AdaptiveCreditBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveCreditBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveCreditBudget): void {
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

  list(): AdaptiveCreditBudget[] {
    const out: AdaptiveCreditBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveCreditBudgetStore(): AdaptiveCreditBudgetStore {
  return new MemoryAdaptiveCreditBudgetStore(new Map<string, AdaptiveCreditBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveCreditBudgetStore implements AdaptiveCreditBudgetStore {
  inner: AdaptiveCreditBudgetStore;
  cache: cache.TtlCache<AdaptiveCreditBudget>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveCreditBudgetStore,
    cacheValue: cache.TtlCache<AdaptiveCreditBudget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveCreditBudget | undefined {
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

  save(item: AdaptiveCreditBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveCreditBudget[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveCreditBudgetStore(inner: AdaptiveCreditBudgetStore, ttl: number, clockValue: clock.Clock): AdaptiveCreditBudgetStore {
  return new CachedAdaptiveCreditBudgetStore(inner, cache.newTtlCache<AdaptiveCreditBudget>(64, ttl, clockValue), 0, 0);
}

/** Selects adaptive credit budgets. Empty fields match all. */
export class AdaptiveCreditBudgetQuery {
  title: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minCost: number, statuses: string[], limit: number) {
    this.title = title;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveCreditBudget): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveCreditBudget[]): AdaptiveCreditBudget[] {
    const matched = collections.filter(items, (candidate: AdaptiveCreditBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveCreditBudgets(store: AdaptiveCreditBudgetStore, query: AdaptiveCreditBudgetQuery): AdaptiveCreditBudget[] {
  return query.apply(store.list());
}
