import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedConversionBudget } from "./weighted-conversion-budget.js";

/** Keeps weighted conversion budgets by code. */
export interface WeightedConversionBudgetStore {
  find(code: string): WeightedConversionBudget | undefined;
  save(item: WeightedConversionBudget): void;
  remove(code: string): boolean;
  list(): WeightedConversionBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedConversionBudgetStore implements WeightedConversionBudgetStore {
  items: Map<string, WeightedConversionBudget>;
  order: string[];

  constructor(items: Map<string, WeightedConversionBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedConversionBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedConversionBudget): void {
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

  list(): WeightedConversionBudget[] {
    const out: WeightedConversionBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedConversionBudgetStore(): WeightedConversionBudgetStore {
  return new MemoryWeightedConversionBudgetStore(new Map<string, WeightedConversionBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedConversionBudgetStore implements WeightedConversionBudgetStore {
  inner: WeightedConversionBudgetStore;
  cache: cache.TtlCache<WeightedConversionBudget>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedConversionBudgetStore,
    cacheValue: cache.TtlCache<WeightedConversionBudget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedConversionBudget | undefined {
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

  save(item: WeightedConversionBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedConversionBudget[] {
    return this.inner.list();
  }
}

export function newCachedWeightedConversionBudgetStore(inner: WeightedConversionBudgetStore, ttl: number, clockValue: clock.Clock): WeightedConversionBudgetStore {
  return new CachedWeightedConversionBudgetStore(
    inner,
    cache.newTtlCache<WeightedConversionBudget>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted conversion budgets. Empty fields match all. */
export class WeightedConversionBudgetQuery {
  label: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minDiscount: number, statuses: string[], limit: number) {
    this.label = label;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedConversionBudget): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedConversionBudget[]): WeightedConversionBudget[] {
    const matched = collections.filter(items, (candidate: WeightedConversionBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedConversionBudgets(store: WeightedConversionBudgetStore, query: WeightedConversionBudgetQuery): WeightedConversionBudget[] {
  return query.apply(store.list());
}
