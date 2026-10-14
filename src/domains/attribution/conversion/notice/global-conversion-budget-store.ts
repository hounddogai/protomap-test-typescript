import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalConversionBudget } from "./global-conversion-budget.js";

/** Keeps global conversion budgets by code. */
export interface GlobalConversionBudgetStore {
  find(code: string): GlobalConversionBudget | undefined;
  save(item: GlobalConversionBudget): void;
  remove(code: string): boolean;
  list(): GlobalConversionBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalConversionBudgetStore implements GlobalConversionBudgetStore {
  items: Map<string, GlobalConversionBudget>;
  order: string[];

  constructor(items: Map<string, GlobalConversionBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalConversionBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalConversionBudget): void {
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

  list(): GlobalConversionBudget[] {
    const out: GlobalConversionBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalConversionBudgetStore(): GlobalConversionBudgetStore {
  return new MemoryGlobalConversionBudgetStore(new Map<string, GlobalConversionBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalConversionBudgetStore implements GlobalConversionBudgetStore {
  inner: GlobalConversionBudgetStore;
  cache: cache.TtlCache<GlobalConversionBudget>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalConversionBudgetStore,
    cacheValue: cache.TtlCache<GlobalConversionBudget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalConversionBudget | undefined {
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

  save(item: GlobalConversionBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalConversionBudget[] {
    return this.inner.list();
  }
}

export function newCachedGlobalConversionBudgetStore(inner: GlobalConversionBudgetStore, ttl: number, clockValue: clock.Clock): GlobalConversionBudgetStore {
  return new CachedGlobalConversionBudgetStore(
    inner,
    cache.newTtlCache<GlobalConversionBudget>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects global conversion budgets. Empty fields match all. */
export class GlobalConversionBudgetQuery {
  label: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minSendAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalConversionBudget): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalConversionBudget[]): GlobalConversionBudget[] {
    const matched = collections.filter(items, (candidate: GlobalConversionBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalConversionBudgets(store: GlobalConversionBudgetStore, query: GlobalConversionBudgetQuery): GlobalConversionBudget[] {
  return query.apply(store.list());
}
