import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DomainBudget } from "./domain-budget.js";

/** Keeps domain budgets by code. */
export interface DomainBudgetStore {
  find(code: string): DomainBudget | undefined;
  save(item: DomainBudget): void;
  remove(code: string): boolean;
  list(): DomainBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDomainBudgetStore implements DomainBudgetStore {
  items: Map<string, DomainBudget>;
  order: string[];

  constructor(items: Map<string, DomainBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DomainBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DomainBudget): void {
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

  list(): DomainBudget[] {
    const out: DomainBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDomainBudgetStore(): DomainBudgetStore {
  return new MemoryDomainBudgetStore(new Map<string, DomainBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDomainBudgetStore implements DomainBudgetStore {
  inner: DomainBudgetStore;
  cache: cache.TtlCache<DomainBudget>;
  hits: number;
  misses: number;

  constructor(inner: DomainBudgetStore, cacheValue: cache.TtlCache<DomainBudget>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DomainBudget | undefined {
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

  save(item: DomainBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DomainBudget[] {
    return this.inner.list();
  }
}

export function newCachedDomainBudgetStore(inner: DomainBudgetStore, ttl: number, clockValue: clock.Clock): DomainBudgetStore {
  return new CachedDomainBudgetStore(inner, cache.newTtlCache<DomainBudget>(64, ttl, clockValue), 0, 0);
}

/** Selects domain budgets. Empty fields match all. */
export class DomainBudgetQuery {
  label: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minWindowDays: number, statuses: string[], limit: number) {
    this.label = label;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DomainBudget): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DomainBudget[]): DomainBudget[] {
    const matched = collections.filter(items, (candidate: DomainBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDomainBudgets(store: DomainBudgetStore, query: DomainBudgetQuery): DomainBudget[] {
  return query.apply(store.list());
}
