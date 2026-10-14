import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedStreakBudget } from "./capped-streak-budget.js";

/** Keeps capped streak budgets by code. */
export interface CappedStreakBudgetStore {
  find(code: string): CappedStreakBudget | undefined;
  save(item: CappedStreakBudget): void;
  remove(code: string): boolean;
  list(): CappedStreakBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedStreakBudgetStore implements CappedStreakBudgetStore {
  items: Map<string, CappedStreakBudget>;
  order: string[];

  constructor(items: Map<string, CappedStreakBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedStreakBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedStreakBudget): void {
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

  list(): CappedStreakBudget[] {
    const out: CappedStreakBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedStreakBudgetStore(): CappedStreakBudgetStore {
  return new MemoryCappedStreakBudgetStore(new Map<string, CappedStreakBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedStreakBudgetStore implements CappedStreakBudgetStore {
  inner: CappedStreakBudgetStore;
  cache: cache.TtlCache<CappedStreakBudget>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedStreakBudgetStore,
    cacheValue: cache.TtlCache<CappedStreakBudget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedStreakBudget | undefined {
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

  save(item: CappedStreakBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedStreakBudget[] {
    return this.inner.list();
  }
}

export function newCachedCappedStreakBudgetStore(inner: CappedStreakBudgetStore, ttl: number, clockValue: clock.Clock): CappedStreakBudgetStore {
  return new CachedCappedStreakBudgetStore(inner, cache.newTtlCache<CappedStreakBudget>(1024, ttl, clockValue), 0, 0);
}

/** Selects capped streak budgets. Empty fields match all. */
export class CappedStreakBudgetQuery {
  locale: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedStreakBudget): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedStreakBudget[]): CappedStreakBudget[] {
    const matched = collections.filter(items, (candidate: CappedStreakBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedStreakBudgets(store: CappedStreakBudgetStore, query: CappedStreakBudgetQuery): CappedStreakBudget[] {
  return query.apply(store.list());
}
