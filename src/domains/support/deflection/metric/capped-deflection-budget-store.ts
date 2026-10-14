import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedDeflectionBudget } from "./capped-deflection-budget.js";

/** Keeps capped deflection budgets by code. */
export interface CappedDeflectionBudgetStore {
  find(code: string): CappedDeflectionBudget | undefined;
  save(item: CappedDeflectionBudget): void;
  remove(code: string): boolean;
  list(): CappedDeflectionBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedDeflectionBudgetStore implements CappedDeflectionBudgetStore {
  items: Map<string, CappedDeflectionBudget>;
  order: string[];

  constructor(items: Map<string, CappedDeflectionBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedDeflectionBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedDeflectionBudget): void {
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

  list(): CappedDeflectionBudget[] {
    const out: CappedDeflectionBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedDeflectionBudgetStore(): CappedDeflectionBudgetStore {
  return new MemoryCappedDeflectionBudgetStore(new Map<string, CappedDeflectionBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedDeflectionBudgetStore implements CappedDeflectionBudgetStore {
  inner: CappedDeflectionBudgetStore;
  cache: cache.TtlCache<CappedDeflectionBudget>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedDeflectionBudgetStore,
    cacheValue: cache.TtlCache<CappedDeflectionBudget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedDeflectionBudget | undefined {
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

  save(item: CappedDeflectionBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedDeflectionBudget[] {
    return this.inner.list();
  }
}

export function newCachedCappedDeflectionBudgetStore(inner: CappedDeflectionBudgetStore, ttl: number, clockValue: clock.Clock): CappedDeflectionBudgetStore {
  return new CachedCappedDeflectionBudgetStore(
    inner,
    cache.newTtlCache<CappedDeflectionBudget>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects capped deflection budgets. Empty fields match all. */
export class CappedDeflectionBudgetQuery {
  label: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minBudget: number, statuses: string[], limit: number) {
    this.label = label;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedDeflectionBudget): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedDeflectionBudget[]): CappedDeflectionBudget[] {
    const matched = collections.filter(items, (candidate: CappedDeflectionBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedDeflectionBudgets(store: CappedDeflectionBudgetStore, query: CappedDeflectionBudgetQuery): CappedDeflectionBudget[] {
  return query.apply(store.list());
}
