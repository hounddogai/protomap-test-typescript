import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PacingBudget } from "./pacing-budget.js";

/** Keeps pacing budgets by code. */
export interface PacingBudgetStore {
  find(code: string): PacingBudget | undefined;
  save(item: PacingBudget): void;
  remove(code: string): boolean;
  list(): PacingBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPacingBudgetStore implements PacingBudgetStore {
  items: Map<string, PacingBudget>;
  order: string[];

  constructor(items: Map<string, PacingBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PacingBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PacingBudget): void {
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

  list(): PacingBudget[] {
    const out: PacingBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPacingBudgetStore(): PacingBudgetStore {
  return new MemoryPacingBudgetStore(new Map<string, PacingBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPacingBudgetStore implements PacingBudgetStore {
  inner: PacingBudgetStore;
  cache: cache.TtlCache<PacingBudget>;
  hits: number;
  misses: number;

  constructor(inner: PacingBudgetStore, cacheValue: cache.TtlCache<PacingBudget>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PacingBudget | undefined {
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

  save(item: PacingBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PacingBudget[] {
    return this.inner.list();
  }
}

export function newCachedPacingBudgetStore(inner: PacingBudgetStore, ttl: number, clockValue: clock.Clock): PacingBudgetStore {
  return new CachedPacingBudgetStore(inner, cache.newTtlCache<PacingBudget>(64, ttl, clockValue), 0, 0);
}

/** Selects pacing budgets. Empty fields match all. */
export class PacingBudgetQuery {
  name: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minCost: number, statuses: string[], limit: number) {
    this.name = name;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PacingBudget): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PacingBudget[]): PacingBudget[] {
    const matched = collections.filter(items, (candidate: PacingBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPacingBudgets(store: PacingBudgetStore, query: PacingBudgetQuery): PacingBudget[] {
  return query.apply(store.list());
}
