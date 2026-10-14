import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { EnrollmentBudget } from "./enrollment-budget.js";

/** Keeps enrollment budgets by code. */
export interface EnrollmentBudgetStore {
  find(code: string): EnrollmentBudget | undefined;
  save(item: EnrollmentBudget): void;
  remove(code: string): boolean;
  list(): EnrollmentBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryEnrollmentBudgetStore implements EnrollmentBudgetStore {
  items: Map<string, EnrollmentBudget>;
  order: string[];

  constructor(items: Map<string, EnrollmentBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): EnrollmentBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: EnrollmentBudget): void {
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

  list(): EnrollmentBudget[] {
    const out: EnrollmentBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryEnrollmentBudgetStore(): EnrollmentBudgetStore {
  return new MemoryEnrollmentBudgetStore(new Map<string, EnrollmentBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedEnrollmentBudgetStore implements EnrollmentBudgetStore {
  inner: EnrollmentBudgetStore;
  cache: cache.TtlCache<EnrollmentBudget>;
  hits: number;
  misses: number;

  constructor(
    inner: EnrollmentBudgetStore,
    cacheValue: cache.TtlCache<EnrollmentBudget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): EnrollmentBudget | undefined {
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

  save(item: EnrollmentBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): EnrollmentBudget[] {
    return this.inner.list();
  }
}

export function newCachedEnrollmentBudgetStore(inner: EnrollmentBudgetStore, ttl: number, clockValue: clock.Clock): EnrollmentBudgetStore {
  return new CachedEnrollmentBudgetStore(inner, cache.newTtlCache<EnrollmentBudget>(128, ttl, clockValue), 0, 0);
}

/** Selects enrollment budgets. Empty fields match all. */
export class EnrollmentBudgetQuery {
  label: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.label = label;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: EnrollmentBudget): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: EnrollmentBudget[]): EnrollmentBudget[] {
    const matched = collections.filter(items, (candidate: EnrollmentBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findEnrollmentBudgets(store: EnrollmentBudgetStore, query: EnrollmentBudgetQuery): EnrollmentBudget[] {
  return query.apply(store.list());
}
