import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { NudgeBudget } from "./nudge-budget.js";

/** Keeps nudge budgets by code. */
export interface NudgeBudgetStore {
  find(code: string): NudgeBudget | undefined;
  save(item: NudgeBudget): void;
  remove(code: string): boolean;
  list(): NudgeBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryNudgeBudgetStore implements NudgeBudgetStore {
  items: Map<string, NudgeBudget>;
  order: string[];

  constructor(items: Map<string, NudgeBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): NudgeBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: NudgeBudget): void {
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

  list(): NudgeBudget[] {
    const out: NudgeBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryNudgeBudgetStore(): NudgeBudgetStore {
  return new MemoryNudgeBudgetStore(new Map<string, NudgeBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedNudgeBudgetStore implements NudgeBudgetStore {
  inner: NudgeBudgetStore;
  cache: cache.TtlCache<NudgeBudget>;
  hits: number;
  misses: number;

  constructor(inner: NudgeBudgetStore, cacheValue: cache.TtlCache<NudgeBudget>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): NudgeBudget | undefined {
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

  save(item: NudgeBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): NudgeBudget[] {
    return this.inner.list();
  }
}

export function newCachedNudgeBudgetStore(inner: NudgeBudgetStore, ttl: number, clockValue: clock.Clock): NudgeBudgetStore {
  return new CachedNudgeBudgetStore(inner, cache.newTtlCache<NudgeBudget>(64, ttl, clockValue), 0, 0);
}

/** Selects nudge budgets. Empty fields match all. */
export class NudgeBudgetQuery {
  locale: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minQuantity: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: NudgeBudget): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: NudgeBudget[]): NudgeBudget[] {
    const matched = collections.filter(items, (candidate: NudgeBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findNudgeBudgets(store: NudgeBudgetStore, query: NudgeBudgetQuery): NudgeBudget[] {
  return query.apply(store.list());
}
