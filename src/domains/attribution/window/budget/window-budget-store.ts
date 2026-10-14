import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WindowBudget } from "./window-budget.js";

/** Keeps window budgets by code. */
export interface WindowBudgetStore {
  find(code: string): WindowBudget | undefined;
  save(item: WindowBudget): void;
  remove(code: string): boolean;
  list(): WindowBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWindowBudgetStore implements WindowBudgetStore {
  items: Map<string, WindowBudget>;
  order: string[];

  constructor(items: Map<string, WindowBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WindowBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WindowBudget): void {
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

  list(): WindowBudget[] {
    const out: WindowBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWindowBudgetStore(): WindowBudgetStore {
  return new MemoryWindowBudgetStore(new Map<string, WindowBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWindowBudgetStore implements WindowBudgetStore {
  inner: WindowBudgetStore;
  cache: cache.TtlCache<WindowBudget>;
  hits: number;
  misses: number;

  constructor(inner: WindowBudgetStore, cacheValue: cache.TtlCache<WindowBudget>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WindowBudget | undefined {
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

  save(item: WindowBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WindowBudget[] {
    return this.inner.list();
  }
}

export function newCachedWindowBudgetStore(inner: WindowBudgetStore, ttl: number, clockValue: clock.Clock): WindowBudgetStore {
  return new CachedWindowBudgetStore(inner, cache.newTtlCache<WindowBudget>(128, ttl, clockValue), 0, 0);
}

/** Selects window budgets. Empty fields match all. */
export class WindowBudgetQuery {
  name: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minOpenRate: number, statuses: string[], limit: number) {
    this.name = name;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WindowBudget): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WindowBudget[]): WindowBudget[] {
    const matched = collections.filter(items, (candidate: WindowBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWindowBudgets(store: WindowBudgetStore, query: WindowBudgetQuery): WindowBudget[] {
  return query.apply(store.list());
}
