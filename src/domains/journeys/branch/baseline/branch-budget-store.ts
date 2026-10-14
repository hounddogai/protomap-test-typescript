import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BranchBudget } from "./branch-budget.js";

/** Keeps branch budgets by code. */
export interface BranchBudgetStore {
  find(code: string): BranchBudget | undefined;
  save(item: BranchBudget): void;
  remove(code: string): boolean;
  list(): BranchBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBranchBudgetStore implements BranchBudgetStore {
  items: Map<string, BranchBudget>;
  order: string[];

  constructor(items: Map<string, BranchBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BranchBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BranchBudget): void {
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

  list(): BranchBudget[] {
    const out: BranchBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBranchBudgetStore(): BranchBudgetStore {
  return new MemoryBranchBudgetStore(new Map<string, BranchBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBranchBudgetStore implements BranchBudgetStore {
  inner: BranchBudgetStore;
  cache: cache.TtlCache<BranchBudget>;
  hits: number;
  misses: number;

  constructor(inner: BranchBudgetStore, cacheValue: cache.TtlCache<BranchBudget>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BranchBudget | undefined {
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

  save(item: BranchBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BranchBudget[] {
    return this.inner.list();
  }
}

export function newCachedBranchBudgetStore(inner: BranchBudgetStore, ttl: number, clockValue: clock.Clock): BranchBudgetStore {
  return new CachedBranchBudgetStore(inner, cache.newTtlCache<BranchBudget>(1024, ttl, clockValue), 0, 0);
}

/** Selects branch budgets. Empty fields match all. */
export class BranchBudgetQuery {
  unit: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minClicks: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BranchBudget): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BranchBudget[]): BranchBudget[] {
    const matched = collections.filter(items, (candidate: BranchBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBranchBudgets(store: BranchBudgetStore, query: BranchBudgetQuery): BranchBudget[] {
  return query.apply(store.list());
}
