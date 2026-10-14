import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingWaitBudget } from "./rolling-wait-budget.js";

/** Keeps rolling wait budgets by code. */
export interface RollingWaitBudgetStore {
  find(code: string): RollingWaitBudget | undefined;
  save(item: RollingWaitBudget): void;
  remove(code: string): boolean;
  list(): RollingWaitBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingWaitBudgetStore implements RollingWaitBudgetStore {
  items: Map<string, RollingWaitBudget>;
  order: string[];

  constructor(items: Map<string, RollingWaitBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingWaitBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingWaitBudget): void {
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

  list(): RollingWaitBudget[] {
    const out: RollingWaitBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingWaitBudgetStore(): RollingWaitBudgetStore {
  return new MemoryRollingWaitBudgetStore(new Map<string, RollingWaitBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingWaitBudgetStore implements RollingWaitBudgetStore {
  inner: RollingWaitBudgetStore;
  cache: cache.TtlCache<RollingWaitBudget>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingWaitBudgetStore,
    cacheValue: cache.TtlCache<RollingWaitBudget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingWaitBudget | undefined {
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

  save(item: RollingWaitBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingWaitBudget[] {
    return this.inner.list();
  }
}

export function newCachedRollingWaitBudgetStore(inner: RollingWaitBudgetStore, ttl: number, clockValue: clock.Clock): RollingWaitBudgetStore {
  return new CachedRollingWaitBudgetStore(inner, cache.newTtlCache<RollingWaitBudget>(1024, ttl, clockValue), 0, 0);
}

/** Selects rolling wait budgets. Empty fields match all. */
export class RollingWaitBudgetQuery {
  name: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minClicks: number, statuses: string[], limit: number) {
    this.name = name;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingWaitBudget): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingWaitBudget[]): RollingWaitBudget[] {
    const matched = collections.filter(items, (candidate: RollingWaitBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingWaitBudgets(store: RollingWaitBudgetStore, query: RollingWaitBudgetQuery): RollingWaitBudget[] {
  return query.apply(store.list());
}
