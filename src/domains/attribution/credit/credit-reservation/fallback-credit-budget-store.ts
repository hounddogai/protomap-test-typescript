import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackCreditBudget } from "./fallback-credit-budget.js";

/** Keeps fallback credit budgets by code. */
export interface FallbackCreditBudgetStore {
  find(code: string): FallbackCreditBudget | undefined;
  save(item: FallbackCreditBudget): void;
  remove(code: string): boolean;
  list(): FallbackCreditBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackCreditBudgetStore implements FallbackCreditBudgetStore {
  items: Map<string, FallbackCreditBudget>;
  order: string[];

  constructor(items: Map<string, FallbackCreditBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackCreditBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackCreditBudget): void {
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

  list(): FallbackCreditBudget[] {
    const out: FallbackCreditBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackCreditBudgetStore(): FallbackCreditBudgetStore {
  return new MemoryFallbackCreditBudgetStore(new Map<string, FallbackCreditBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackCreditBudgetStore implements FallbackCreditBudgetStore {
  inner: FallbackCreditBudgetStore;
  cache: cache.TtlCache<FallbackCreditBudget>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackCreditBudgetStore,
    cacheValue: cache.TtlCache<FallbackCreditBudget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackCreditBudget | undefined {
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

  save(item: FallbackCreditBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackCreditBudget[] {
    return this.inner.list();
  }
}

export function newCachedFallbackCreditBudgetStore(inner: FallbackCreditBudgetStore, ttl: number, clockValue: clock.Clock): FallbackCreditBudgetStore {
  return new CachedFallbackCreditBudgetStore(
    inner,
    cache.newTtlCache<FallbackCreditBudget>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback credit budgets. Empty fields match all. */
export class FallbackCreditBudgetQuery {
  label: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minBatchSize: number, statuses: string[], limit: number) {
    this.label = label;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackCreditBudget): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackCreditBudget[]): FallbackCreditBudget[] {
    const matched = collections.filter(items, (candidate: FallbackCreditBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackCreditBudgets(store: FallbackCreditBudgetStore, query: FallbackCreditBudgetQuery): FallbackCreditBudget[] {
  return query.apply(store.list());
}
