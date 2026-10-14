import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalFrequencyBudget } from "./global-frequency-budget.js";

/** Keeps global frequency budgets by code. */
export interface GlobalFrequencyBudgetStore {
  find(code: string): GlobalFrequencyBudget | undefined;
  save(item: GlobalFrequencyBudget): void;
  remove(code: string): boolean;
  list(): GlobalFrequencyBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalFrequencyBudgetStore implements GlobalFrequencyBudgetStore {
  items: Map<string, GlobalFrequencyBudget>;
  order: string[];

  constructor(items: Map<string, GlobalFrequencyBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalFrequencyBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalFrequencyBudget): void {
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

  list(): GlobalFrequencyBudget[] {
    const out: GlobalFrequencyBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalFrequencyBudgetStore(): GlobalFrequencyBudgetStore {
  return new MemoryGlobalFrequencyBudgetStore(new Map<string, GlobalFrequencyBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalFrequencyBudgetStore implements GlobalFrequencyBudgetStore {
  inner: GlobalFrequencyBudgetStore;
  cache: cache.TtlCache<GlobalFrequencyBudget>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalFrequencyBudgetStore,
    cacheValue: cache.TtlCache<GlobalFrequencyBudget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalFrequencyBudget | undefined {
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

  save(item: GlobalFrequencyBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalFrequencyBudget[] {
    return this.inner.list();
  }
}

export function newCachedGlobalFrequencyBudgetStore(inner: GlobalFrequencyBudgetStore, ttl: number, clockValue: clock.Clock): GlobalFrequencyBudgetStore {
  return new CachedGlobalFrequencyBudgetStore(
    inner,
    cache.newTtlCache<GlobalFrequencyBudget>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects global frequency budgets. Empty fields match all. */
export class GlobalFrequencyBudgetQuery {
  name: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minVersion: number, statuses: string[], limit: number) {
    this.name = name;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalFrequencyBudget): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalFrequencyBudget[]): GlobalFrequencyBudget[] {
    const matched = collections.filter(items, (candidate: GlobalFrequencyBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalFrequencyBudgets(store: GlobalFrequencyBudgetStore, query: GlobalFrequencyBudgetQuery): GlobalFrequencyBudget[] {
  return query.apply(store.list());
}
