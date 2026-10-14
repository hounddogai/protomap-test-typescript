import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackDoubleOptInBudget } from "./fallback-double-opt-in-budget.js";

/** Keeps fallback double opt in budgets by code. */
export interface FallbackDoubleOptInBudgetStore {
  find(code: string): FallbackDoubleOptInBudget | undefined;
  save(item: FallbackDoubleOptInBudget): void;
  remove(code: string): boolean;
  list(): FallbackDoubleOptInBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackDoubleOptInBudgetStore implements FallbackDoubleOptInBudgetStore {
  items: Map<string, FallbackDoubleOptInBudget>;
  order: string[];

  constructor(items: Map<string, FallbackDoubleOptInBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackDoubleOptInBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackDoubleOptInBudget): void {
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

  list(): FallbackDoubleOptInBudget[] {
    const out: FallbackDoubleOptInBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackDoubleOptInBudgetStore(): FallbackDoubleOptInBudgetStore {
  return new MemoryFallbackDoubleOptInBudgetStore(new Map<string, FallbackDoubleOptInBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackDoubleOptInBudgetStore implements FallbackDoubleOptInBudgetStore {
  inner: FallbackDoubleOptInBudgetStore;
  cache: cache.TtlCache<FallbackDoubleOptInBudget>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackDoubleOptInBudgetStore,
    cacheValue: cache.TtlCache<FallbackDoubleOptInBudget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackDoubleOptInBudget | undefined {
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

  save(item: FallbackDoubleOptInBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackDoubleOptInBudget[] {
    return this.inner.list();
  }
}

export function newCachedFallbackDoubleOptInBudgetStore(inner: FallbackDoubleOptInBudgetStore, ttl: number, clockValue: clock.Clock): FallbackDoubleOptInBudgetStore {
  return new CachedFallbackDoubleOptInBudgetStore(
    inner,
    cache.newTtlCache<FallbackDoubleOptInBudget>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback double opt in budgets. Empty fields match all. */
export class FallbackDoubleOptInBudgetQuery {
  name: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minBatchSize: number, statuses: string[], limit: number) {
    this.name = name;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackDoubleOptInBudget): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackDoubleOptInBudget[]): FallbackDoubleOptInBudget[] {
    const matched = collections.filter(items, (candidate: FallbackDoubleOptInBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackDoubleOptInBudgets(store: FallbackDoubleOptInBudgetStore, query: FallbackDoubleOptInBudgetQuery): FallbackDoubleOptInBudget[] {
  return query.apply(store.list());
}
