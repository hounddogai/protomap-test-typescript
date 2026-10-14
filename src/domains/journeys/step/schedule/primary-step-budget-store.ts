import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryStepBudget } from "./primary-step-budget.js";

/** Keeps primary step budgets by code. */
export interface PrimaryStepBudgetStore {
  find(code: string): PrimaryStepBudget | undefined;
  save(item: PrimaryStepBudget): void;
  remove(code: string): boolean;
  list(): PrimaryStepBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryStepBudgetStore implements PrimaryStepBudgetStore {
  items: Map<string, PrimaryStepBudget>;
  order: string[];

  constructor(items: Map<string, PrimaryStepBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryStepBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryStepBudget): void {
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

  list(): PrimaryStepBudget[] {
    const out: PrimaryStepBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryStepBudgetStore(): PrimaryStepBudgetStore {
  return new MemoryPrimaryStepBudgetStore(new Map<string, PrimaryStepBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryStepBudgetStore implements PrimaryStepBudgetStore {
  inner: PrimaryStepBudgetStore;
  cache: cache.TtlCache<PrimaryStepBudget>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryStepBudgetStore,
    cacheValue: cache.TtlCache<PrimaryStepBudget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryStepBudget | undefined {
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

  save(item: PrimaryStepBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryStepBudget[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryStepBudgetStore(inner: PrimaryStepBudgetStore, ttl: number, clockValue: clock.Clock): PrimaryStepBudgetStore {
  return new CachedPrimaryStepBudgetStore(inner, cache.newTtlCache<PrimaryStepBudget>(1024, ttl, clockValue), 0, 0);
}

/** Selects primary step budgets. Empty fields match all. */
export class PrimaryStepBudgetQuery {
  region: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minBudget: number, statuses: string[], limit: number) {
    this.region = region;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryStepBudget): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryStepBudget[]): PrimaryStepBudget[] {
    const matched = collections.filter(items, (candidate: PrimaryStepBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryStepBudgets(store: PrimaryStepBudgetStore, query: PrimaryStepBudgetQuery): PrimaryStepBudget[] {
  return query.apply(store.list());
}
