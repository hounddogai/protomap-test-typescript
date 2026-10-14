import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DoubleOptInBudget } from "./double-opt-in-budget.js";

/** Keeps double opt in budgets by code. */
export interface DoubleOptInBudgetStore {
  find(code: string): DoubleOptInBudget | undefined;
  save(item: DoubleOptInBudget): void;
  remove(code: string): boolean;
  list(): DoubleOptInBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDoubleOptInBudgetStore implements DoubleOptInBudgetStore {
  items: Map<string, DoubleOptInBudget>;
  order: string[];

  constructor(items: Map<string, DoubleOptInBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DoubleOptInBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DoubleOptInBudget): void {
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

  list(): DoubleOptInBudget[] {
    const out: DoubleOptInBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDoubleOptInBudgetStore(): DoubleOptInBudgetStore {
  return new MemoryDoubleOptInBudgetStore(new Map<string, DoubleOptInBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDoubleOptInBudgetStore implements DoubleOptInBudgetStore {
  inner: DoubleOptInBudgetStore;
  cache: cache.TtlCache<DoubleOptInBudget>;
  hits: number;
  misses: number;

  constructor(
    inner: DoubleOptInBudgetStore,
    cacheValue: cache.TtlCache<DoubleOptInBudget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DoubleOptInBudget | undefined {
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

  save(item: DoubleOptInBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DoubleOptInBudget[] {
    return this.inner.list();
  }
}

export function newCachedDoubleOptInBudgetStore(inner: DoubleOptInBudgetStore, ttl: number, clockValue: clock.Clock): DoubleOptInBudgetStore {
  return new CachedDoubleOptInBudgetStore(inner, cache.newTtlCache<DoubleOptInBudget>(64, ttl, clockValue), 0, 0);
}

/** Selects double opt in budgets. Empty fields match all. */
export class DoubleOptInBudgetQuery {
  title: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minAmount: number, statuses: string[], limit: number) {
    this.title = title;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DoubleOptInBudget): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DoubleOptInBudget[]): DoubleOptInBudget[] {
    const matched = collections.filter(items, (candidate: DoubleOptInBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDoubleOptInBudgets(store: DoubleOptInBudgetStore, query: DoubleOptInBudgetQuery): DoubleOptInBudget[] {
  return query.apply(store.list());
}
