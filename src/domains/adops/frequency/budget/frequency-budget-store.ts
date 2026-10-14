import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FrequencyBudget } from "./frequency-budget.js";

/** Keeps frequency budgets by code. */
export interface FrequencyBudgetStore {
  find(code: string): FrequencyBudget | undefined;
  save(item: FrequencyBudget): void;
  remove(code: string): boolean;
  list(): FrequencyBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFrequencyBudgetStore implements FrequencyBudgetStore {
  items: Map<string, FrequencyBudget>;
  order: string[];

  constructor(items: Map<string, FrequencyBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FrequencyBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FrequencyBudget): void {
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

  list(): FrequencyBudget[] {
    const out: FrequencyBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFrequencyBudgetStore(): FrequencyBudgetStore {
  return new MemoryFrequencyBudgetStore(new Map<string, FrequencyBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFrequencyBudgetStore implements FrequencyBudgetStore {
  inner: FrequencyBudgetStore;
  cache: cache.TtlCache<FrequencyBudget>;
  hits: number;
  misses: number;

  constructor(
    inner: FrequencyBudgetStore,
    cacheValue: cache.TtlCache<FrequencyBudget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FrequencyBudget | undefined {
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

  save(item: FrequencyBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FrequencyBudget[] {
    return this.inner.list();
  }
}

export function newCachedFrequencyBudgetStore(inner: FrequencyBudgetStore, ttl: number, clockValue: clock.Clock): FrequencyBudgetStore {
  return new CachedFrequencyBudgetStore(inner, cache.newTtlCache<FrequencyBudget>(512, ttl, clockValue), 0, 0);
}

/** Selects frequency budgets. Empty fields match all. */
export class FrequencyBudgetQuery {
  locale: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minRetries: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FrequencyBudget): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FrequencyBudget[]): FrequencyBudget[] {
    const matched = collections.filter(items, (candidate: FrequencyBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFrequencyBudgets(store: FrequencyBudgetStore, query: FrequencyBudgetQuery): FrequencyBudget[] {
  return query.apply(store.list());
}
