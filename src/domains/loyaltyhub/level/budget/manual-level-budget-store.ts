import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualLevelBudget } from "./manual-level-budget.js";

/** Keeps manual level budgets by code. */
export interface ManualLevelBudgetStore {
  find(code: string): ManualLevelBudget | undefined;
  save(item: ManualLevelBudget): void;
  remove(code: string): boolean;
  list(): ManualLevelBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualLevelBudgetStore implements ManualLevelBudgetStore {
  items: Map<string, ManualLevelBudget>;
  order: string[];

  constructor(items: Map<string, ManualLevelBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualLevelBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualLevelBudget): void {
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

  list(): ManualLevelBudget[] {
    const out: ManualLevelBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualLevelBudgetStore(): ManualLevelBudgetStore {
  return new MemoryManualLevelBudgetStore(new Map<string, ManualLevelBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualLevelBudgetStore implements ManualLevelBudgetStore {
  inner: ManualLevelBudgetStore;
  cache: cache.TtlCache<ManualLevelBudget>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualLevelBudgetStore,
    cacheValue: cache.TtlCache<ManualLevelBudget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualLevelBudget | undefined {
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

  save(item: ManualLevelBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualLevelBudget[] {
    return this.inner.list();
  }
}

export function newCachedManualLevelBudgetStore(inner: ManualLevelBudgetStore, ttl: number, clockValue: clock.Clock): ManualLevelBudgetStore {
  return new CachedManualLevelBudgetStore(inner, cache.newTtlCache<ManualLevelBudget>(1024, ttl, clockValue), 0, 0);
}

/** Selects manual level budgets. Empty fields match all. */
export class ManualLevelBudgetQuery {
  region: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minCapacity: number, statuses: string[], limit: number) {
    this.region = region;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualLevelBudget): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualLevelBudget[]): ManualLevelBudget[] {
    const matched = collections.filter(items, (candidate: ManualLevelBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualLevelBudgets(store: ManualLevelBudgetStore, query: ManualLevelBudgetQuery): ManualLevelBudget[] {
  return query.apply(store.list());
}
