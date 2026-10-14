import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveDeflectionBudget } from "./adaptive-deflection-budget.js";

/** Keeps adaptive deflection budgets by code. */
export interface AdaptiveDeflectionBudgetStore {
  find(code: string): AdaptiveDeflectionBudget | undefined;
  save(item: AdaptiveDeflectionBudget): void;
  remove(code: string): boolean;
  list(): AdaptiveDeflectionBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveDeflectionBudgetStore implements AdaptiveDeflectionBudgetStore {
  items: Map<string, AdaptiveDeflectionBudget>;
  order: string[];

  constructor(items: Map<string, AdaptiveDeflectionBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveDeflectionBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveDeflectionBudget): void {
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

  list(): AdaptiveDeflectionBudget[] {
    const out: AdaptiveDeflectionBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveDeflectionBudgetStore(): AdaptiveDeflectionBudgetStore {
  return new MemoryAdaptiveDeflectionBudgetStore(new Map<string, AdaptiveDeflectionBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveDeflectionBudgetStore implements AdaptiveDeflectionBudgetStore {
  inner: AdaptiveDeflectionBudgetStore;
  cache: cache.TtlCache<AdaptiveDeflectionBudget>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveDeflectionBudgetStore,
    cacheValue: cache.TtlCache<AdaptiveDeflectionBudget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveDeflectionBudget | undefined {
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

  save(item: AdaptiveDeflectionBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveDeflectionBudget[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveDeflectionBudgetStore(inner: AdaptiveDeflectionBudgetStore, ttl: number, clockValue: clock.Clock): AdaptiveDeflectionBudgetStore {
  return new CachedAdaptiveDeflectionBudgetStore(
    inner,
    cache.newTtlCache<AdaptiveDeflectionBudget>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive deflection budgets. Empty fields match all. */
export class AdaptiveDeflectionBudgetQuery {
  title: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveDeflectionBudget): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveDeflectionBudget[]): AdaptiveDeflectionBudget[] {
    const matched = collections.filter(items, (candidate: AdaptiveDeflectionBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveDeflectionBudgets(store: AdaptiveDeflectionBudgetStore, query: AdaptiveDeflectionBudgetQuery): AdaptiveDeflectionBudget[] {
  return query.apply(store.list());
}
