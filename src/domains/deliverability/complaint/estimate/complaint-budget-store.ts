import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ComplaintBudget } from "./complaint-budget.js";

/** Keeps complaint budgets by code. */
export interface ComplaintBudgetStore {
  find(code: string): ComplaintBudget | undefined;
  save(item: ComplaintBudget): void;
  remove(code: string): boolean;
  list(): ComplaintBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryComplaintBudgetStore implements ComplaintBudgetStore {
  items: Map<string, ComplaintBudget>;
  order: string[];

  constructor(items: Map<string, ComplaintBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ComplaintBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ComplaintBudget): void {
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

  list(): ComplaintBudget[] {
    const out: ComplaintBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryComplaintBudgetStore(): ComplaintBudgetStore {
  return new MemoryComplaintBudgetStore(new Map<string, ComplaintBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedComplaintBudgetStore implements ComplaintBudgetStore {
  inner: ComplaintBudgetStore;
  cache: cache.TtlCache<ComplaintBudget>;
  hits: number;
  misses: number;

  constructor(
    inner: ComplaintBudgetStore,
    cacheValue: cache.TtlCache<ComplaintBudget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ComplaintBudget | undefined {
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

  save(item: ComplaintBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ComplaintBudget[] {
    return this.inner.list();
  }
}

export function newCachedComplaintBudgetStore(inner: ComplaintBudgetStore, ttl: number, clockValue: clock.Clock): ComplaintBudgetStore {
  return new CachedComplaintBudgetStore(inner, cache.newTtlCache<ComplaintBudget>(64, ttl, clockValue), 0, 0);
}

/** Selects complaint budgets. Empty fields match all. */
export class ComplaintBudgetQuery {
  name: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minSequence: number, statuses: string[], limit: number) {
    this.name = name;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ComplaintBudget): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ComplaintBudget[]): ComplaintBudget[] {
    const matched = collections.filter(items, (candidate: ComplaintBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findComplaintBudgets(store: ComplaintBudgetStore, query: ComplaintBudgetQuery): ComplaintBudget[] {
  return query.apply(store.list());
}
