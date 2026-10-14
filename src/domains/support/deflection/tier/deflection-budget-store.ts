import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DeflectionBudget } from "./deflection-budget.js";

/** Keeps deflection budgets by code. */
export interface DeflectionBudgetStore {
  find(code: string): DeflectionBudget | undefined;
  save(item: DeflectionBudget): void;
  remove(code: string): boolean;
  list(): DeflectionBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDeflectionBudgetStore implements DeflectionBudgetStore {
  items: Map<string, DeflectionBudget>;
  order: string[];

  constructor(items: Map<string, DeflectionBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DeflectionBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DeflectionBudget): void {
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

  list(): DeflectionBudget[] {
    const out: DeflectionBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDeflectionBudgetStore(): DeflectionBudgetStore {
  return new MemoryDeflectionBudgetStore(new Map<string, DeflectionBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDeflectionBudgetStore implements DeflectionBudgetStore {
  inner: DeflectionBudgetStore;
  cache: cache.TtlCache<DeflectionBudget>;
  hits: number;
  misses: number;

  constructor(
    inner: DeflectionBudgetStore,
    cacheValue: cache.TtlCache<DeflectionBudget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DeflectionBudget | undefined {
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

  save(item: DeflectionBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DeflectionBudget[] {
    return this.inner.list();
  }
}

export function newCachedDeflectionBudgetStore(inner: DeflectionBudgetStore, ttl: number, clockValue: clock.Clock): DeflectionBudgetStore {
  return new CachedDeflectionBudgetStore(inner, cache.newTtlCache<DeflectionBudget>(64, ttl, clockValue), 0, 0);
}

/** Selects deflection budgets. Empty fields match all. */
export class DeflectionBudgetQuery {
  locale: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minWeight: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DeflectionBudget): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DeflectionBudget[]): DeflectionBudget[] {
    const matched = collections.filter(items, (candidate: DeflectionBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDeflectionBudgets(store: DeflectionBudgetStore, query: DeflectionBudgetQuery): DeflectionBudget[] {
  return query.apply(store.list());
}
