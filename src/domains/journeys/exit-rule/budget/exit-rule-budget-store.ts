import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ExitRuleBudget } from "./exit-rule-budget.js";

/** Keeps exit rule budgets by code. */
export interface ExitRuleBudgetStore {
  find(code: string): ExitRuleBudget | undefined;
  save(item: ExitRuleBudget): void;
  remove(code: string): boolean;
  list(): ExitRuleBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryExitRuleBudgetStore implements ExitRuleBudgetStore {
  items: Map<string, ExitRuleBudget>;
  order: string[];

  constructor(items: Map<string, ExitRuleBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ExitRuleBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ExitRuleBudget): void {
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

  list(): ExitRuleBudget[] {
    const out: ExitRuleBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryExitRuleBudgetStore(): ExitRuleBudgetStore {
  return new MemoryExitRuleBudgetStore(new Map<string, ExitRuleBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedExitRuleBudgetStore implements ExitRuleBudgetStore {
  inner: ExitRuleBudgetStore;
  cache: cache.TtlCache<ExitRuleBudget>;
  hits: number;
  misses: number;

  constructor(
    inner: ExitRuleBudgetStore,
    cacheValue: cache.TtlCache<ExitRuleBudget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ExitRuleBudget | undefined {
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

  save(item: ExitRuleBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ExitRuleBudget[] {
    return this.inner.list();
  }
}

export function newCachedExitRuleBudgetStore(inner: ExitRuleBudgetStore, ttl: number, clockValue: clock.Clock): ExitRuleBudgetStore {
  return new CachedExitRuleBudgetStore(inner, cache.newTtlCache<ExitRuleBudget>(128, ttl, clockValue), 0, 0);
}

/** Selects exit rule budgets. Empty fields match all. */
export class ExitRuleBudgetQuery {
  category: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minSendAt: number, statuses: string[], limit: number) {
    this.category = category;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ExitRuleBudget): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ExitRuleBudget[]): ExitRuleBudget[] {
    const matched = collections.filter(items, (candidate: ExitRuleBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findExitRuleBudgets(store: ExitRuleBudgetStore, query: ExitRuleBudgetQuery): ExitRuleBudget[] {
  return query.apply(store.list());
}
