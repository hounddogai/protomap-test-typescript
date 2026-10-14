import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedCreativeBudget } from "./capped-creative-budget.js";

/** Keeps capped creative budgets by code. */
export interface CappedCreativeBudgetStore {
  find(code: string): CappedCreativeBudget | undefined;
  save(item: CappedCreativeBudget): void;
  remove(code: string): boolean;
  list(): CappedCreativeBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedCreativeBudgetStore implements CappedCreativeBudgetStore {
  items: Map<string, CappedCreativeBudget>;
  order: string[];

  constructor(items: Map<string, CappedCreativeBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedCreativeBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedCreativeBudget): void {
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

  list(): CappedCreativeBudget[] {
    const out: CappedCreativeBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedCreativeBudgetStore(): CappedCreativeBudgetStore {
  return new MemoryCappedCreativeBudgetStore(new Map<string, CappedCreativeBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedCreativeBudgetStore implements CappedCreativeBudgetStore {
  inner: CappedCreativeBudgetStore;
  cache: cache.TtlCache<CappedCreativeBudget>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedCreativeBudgetStore,
    cacheValue: cache.TtlCache<CappedCreativeBudget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedCreativeBudget | undefined {
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

  save(item: CappedCreativeBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedCreativeBudget[] {
    return this.inner.list();
  }
}

export function newCachedCappedCreativeBudgetStore(inner: CappedCreativeBudgetStore, ttl: number, clockValue: clock.Clock): CappedCreativeBudgetStore {
  return new CachedCappedCreativeBudgetStore(
    inner,
    cache.newTtlCache<CappedCreativeBudget>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects capped creative budgets. Empty fields match all. */
export class CappedCreativeBudgetQuery {
  country: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minCost: number, statuses: string[], limit: number) {
    this.country = country;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedCreativeBudget): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedCreativeBudget[]): CappedCreativeBudget[] {
    const matched = collections.filter(items, (candidate: CappedCreativeBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedCreativeBudgets(store: CappedCreativeBudgetStore, query: CappedCreativeBudgetQuery): CappedCreativeBudget[] {
  return query.apply(store.list());
}
