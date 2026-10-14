import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CohortBudget } from "./cohort-budget.js";

/** Keeps cohort budgets by code. */
export interface CohortBudgetStore {
  find(code: string): CohortBudget | undefined;
  save(item: CohortBudget): void;
  remove(code: string): boolean;
  list(): CohortBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCohortBudgetStore implements CohortBudgetStore {
  items: Map<string, CohortBudget>;
  order: string[];

  constructor(items: Map<string, CohortBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CohortBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CohortBudget): void {
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

  list(): CohortBudget[] {
    const out: CohortBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCohortBudgetStore(): CohortBudgetStore {
  return new MemoryCohortBudgetStore(new Map<string, CohortBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCohortBudgetStore implements CohortBudgetStore {
  inner: CohortBudgetStore;
  cache: cache.TtlCache<CohortBudget>;
  hits: number;
  misses: number;

  constructor(inner: CohortBudgetStore, cacheValue: cache.TtlCache<CohortBudget>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CohortBudget | undefined {
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

  save(item: CohortBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CohortBudget[] {
    return this.inner.list();
  }
}

export function newCachedCohortBudgetStore(inner: CohortBudgetStore, ttl: number, clockValue: clock.Clock): CohortBudgetStore {
  return new CachedCohortBudgetStore(inner, cache.newTtlCache<CohortBudget>(128, ttl, clockValue), 0, 0);
}

/** Selects cohort budgets. Empty fields match all. */
export class CohortBudgetQuery {
  source: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minSendAt: number, statuses: string[], limit: number) {
    this.source = source;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CohortBudget): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CohortBudget[]): CohortBudget[] {
    const matched = collections.filter(items, (candidate: CohortBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCohortBudgets(store: CohortBudgetStore, query: CohortBudgetQuery): CohortBudget[] {
  return query.apply(store.list());
}
