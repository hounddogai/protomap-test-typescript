import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StepBudget } from "./step-budget.js";

/** Keeps step budgets by code. */
export interface StepBudgetStore {
  find(code: string): StepBudget | undefined;
  save(item: StepBudget): void;
  remove(code: string): boolean;
  list(): StepBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStepBudgetStore implements StepBudgetStore {
  items: Map<string, StepBudget>;
  order: string[];

  constructor(items: Map<string, StepBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StepBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StepBudget): void {
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

  list(): StepBudget[] {
    const out: StepBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStepBudgetStore(): StepBudgetStore {
  return new MemoryStepBudgetStore(new Map<string, StepBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStepBudgetStore implements StepBudgetStore {
  inner: StepBudgetStore;
  cache: cache.TtlCache<StepBudget>;
  hits: number;
  misses: number;

  constructor(inner: StepBudgetStore, cacheValue: cache.TtlCache<StepBudget>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StepBudget | undefined {
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

  save(item: StepBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StepBudget[] {
    return this.inner.list();
  }
}

export function newCachedStepBudgetStore(inner: StepBudgetStore, ttl: number, clockValue: clock.Clock): StepBudgetStore {
  return new CachedStepBudgetStore(inner, cache.newTtlCache<StepBudget>(64, ttl, clockValue), 0, 0);
}

/** Selects step budgets. Empty fields match all. */
export class StepBudgetQuery {
  unit: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minLimit: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StepBudget): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StepBudget[]): StepBudget[] {
    const matched = collections.filter(items, (candidate: StepBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStepBudgets(store: StepBudgetStore, query: StepBudgetQuery): StepBudget[] {
  return query.apply(store.list());
}
