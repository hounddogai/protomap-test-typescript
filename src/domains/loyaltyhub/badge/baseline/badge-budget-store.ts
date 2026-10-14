import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BadgeBudget } from "./badge-budget.js";

/** Keeps badge budgets by code. */
export interface BadgeBudgetStore {
  find(code: string): BadgeBudget | undefined;
  save(item: BadgeBudget): void;
  remove(code: string): boolean;
  list(): BadgeBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBadgeBudgetStore implements BadgeBudgetStore {
  items: Map<string, BadgeBudget>;
  order: string[];

  constructor(items: Map<string, BadgeBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BadgeBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BadgeBudget): void {
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

  list(): BadgeBudget[] {
    const out: BadgeBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBadgeBudgetStore(): BadgeBudgetStore {
  return new MemoryBadgeBudgetStore(new Map<string, BadgeBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBadgeBudgetStore implements BadgeBudgetStore {
  inner: BadgeBudgetStore;
  cache: cache.TtlCache<BadgeBudget>;
  hits: number;
  misses: number;

  constructor(inner: BadgeBudgetStore, cacheValue: cache.TtlCache<BadgeBudget>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BadgeBudget | undefined {
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

  save(item: BadgeBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BadgeBudget[] {
    return this.inner.list();
  }
}

export function newCachedBadgeBudgetStore(inner: BadgeBudgetStore, ttl: number, clockValue: clock.Clock): BadgeBudgetStore {
  return new CachedBadgeBudgetStore(inner, cache.newTtlCache<BadgeBudget>(256, ttl, clockValue), 0, 0);
}

/** Selects badge budgets. Empty fields match all. */
export class BadgeBudgetQuery {
  label: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BadgeBudget): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BadgeBudget[]): BadgeBudget[] {
    const matched = collections.filter(items, (candidate: BadgeBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBadgeBudgets(store: BadgeBudgetStore, query: BadgeBudgetQuery): BadgeBudget[] {
  return query.apply(store.list());
}
