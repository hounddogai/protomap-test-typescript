import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedBounceBudget } from "./capped-bounce-budget.js";

/** Keeps capped bounce budgets by code. */
export interface CappedBounceBudgetStore {
  find(code: string): CappedBounceBudget | undefined;
  save(item: CappedBounceBudget): void;
  remove(code: string): boolean;
  list(): CappedBounceBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedBounceBudgetStore implements CappedBounceBudgetStore {
  items: Map<string, CappedBounceBudget>;
  order: string[];

  constructor(items: Map<string, CappedBounceBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedBounceBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedBounceBudget): void {
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

  list(): CappedBounceBudget[] {
    const out: CappedBounceBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedBounceBudgetStore(): CappedBounceBudgetStore {
  return new MemoryCappedBounceBudgetStore(new Map<string, CappedBounceBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedBounceBudgetStore implements CappedBounceBudgetStore {
  inner: CappedBounceBudgetStore;
  cache: cache.TtlCache<CappedBounceBudget>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedBounceBudgetStore,
    cacheValue: cache.TtlCache<CappedBounceBudget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedBounceBudget | undefined {
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

  save(item: CappedBounceBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedBounceBudget[] {
    return this.inner.list();
  }
}

export function newCachedCappedBounceBudgetStore(inner: CappedBounceBudgetStore, ttl: number, clockValue: clock.Clock): CappedBounceBudgetStore {
  return new CachedCappedBounceBudgetStore(inner, cache.newTtlCache<CappedBounceBudget>(1024, ttl, clockValue), 0, 0);
}

/** Selects capped bounce budgets. Empty fields match all. */
export class CappedBounceBudgetQuery {
  locale: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedBounceBudget): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedBounceBudget[]): CappedBounceBudget[] {
    const matched = collections.filter(items, (candidate: CappedBounceBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedBounceBudgets(store: CappedBounceBudgetStore, query: CappedBounceBudgetQuery): CappedBounceBudget[] {
  return query.apply(store.list());
}
