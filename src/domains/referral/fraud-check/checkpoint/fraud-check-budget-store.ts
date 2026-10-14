import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FraudCheckBudget } from "./fraud-check-budget.js";

/** Keeps fraud check budgets by code. */
export interface FraudCheckBudgetStore {
  find(code: string): FraudCheckBudget | undefined;
  save(item: FraudCheckBudget): void;
  remove(code: string): boolean;
  list(): FraudCheckBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFraudCheckBudgetStore implements FraudCheckBudgetStore {
  items: Map<string, FraudCheckBudget>;
  order: string[];

  constructor(items: Map<string, FraudCheckBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FraudCheckBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FraudCheckBudget): void {
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

  list(): FraudCheckBudget[] {
    const out: FraudCheckBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFraudCheckBudgetStore(): FraudCheckBudgetStore {
  return new MemoryFraudCheckBudgetStore(new Map<string, FraudCheckBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFraudCheckBudgetStore implements FraudCheckBudgetStore {
  inner: FraudCheckBudgetStore;
  cache: cache.TtlCache<FraudCheckBudget>;
  hits: number;
  misses: number;

  constructor(
    inner: FraudCheckBudgetStore,
    cacheValue: cache.TtlCache<FraudCheckBudget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FraudCheckBudget | undefined {
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

  save(item: FraudCheckBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FraudCheckBudget[] {
    return this.inner.list();
  }
}

export function newCachedFraudCheckBudgetStore(inner: FraudCheckBudgetStore, ttl: number, clockValue: clock.Clock): FraudCheckBudgetStore {
  return new CachedFraudCheckBudgetStore(inner, cache.newTtlCache<FraudCheckBudget>(512, ttl, clockValue), 0, 0);
}

/** Selects fraud check budgets. Empty fields match all. */
export class FraudCheckBudgetQuery {
  label: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minAttempts: number, statuses: string[], limit: number) {
    this.label = label;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FraudCheckBudget): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FraudCheckBudget[]): FraudCheckBudget[] {
    const matched = collections.filter(items, (candidate: FraudCheckBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFraudCheckBudgets(store: FraudCheckBudgetStore, query: FraudCheckBudgetQuery): FraudCheckBudget[] {
  return query.apply(store.list());
}
