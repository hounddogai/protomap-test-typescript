import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyOptOutBudget } from "./legacy-opt-out-budget.js";

/** Keeps legacy opt out budgets by code. */
export interface LegacyOptOutBudgetStore {
  find(code: string): LegacyOptOutBudget | undefined;
  save(item: LegacyOptOutBudget): void;
  remove(code: string): boolean;
  list(): LegacyOptOutBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyOptOutBudgetStore implements LegacyOptOutBudgetStore {
  items: Map<string, LegacyOptOutBudget>;
  order: string[];

  constructor(items: Map<string, LegacyOptOutBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyOptOutBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyOptOutBudget): void {
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

  list(): LegacyOptOutBudget[] {
    const out: LegacyOptOutBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyOptOutBudgetStore(): LegacyOptOutBudgetStore {
  return new MemoryLegacyOptOutBudgetStore(new Map<string, LegacyOptOutBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyOptOutBudgetStore implements LegacyOptOutBudgetStore {
  inner: LegacyOptOutBudgetStore;
  cache: cache.TtlCache<LegacyOptOutBudget>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyOptOutBudgetStore,
    cacheValue: cache.TtlCache<LegacyOptOutBudget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyOptOutBudget | undefined {
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

  save(item: LegacyOptOutBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyOptOutBudget[] {
    return this.inner.list();
  }
}

export function newCachedLegacyOptOutBudgetStore(inner: LegacyOptOutBudgetStore, ttl: number, clockValue: clock.Clock): LegacyOptOutBudgetStore {
  return new CachedLegacyOptOutBudgetStore(inner, cache.newTtlCache<LegacyOptOutBudget>(1024, ttl, clockValue), 0, 0);
}

/** Selects legacy opt out budgets. Empty fields match all. */
export class LegacyOptOutBudgetQuery {
  category: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minBid: number, statuses: string[], limit: number) {
    this.category = category;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyOptOutBudget): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyOptOutBudget[]): LegacyOptOutBudget[] {
    const matched = collections.filter(items, (candidate: LegacyOptOutBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyOptOutBudgets(store: LegacyOptOutBudgetStore, query: LegacyOptOutBudgetQuery): LegacyOptOutBudget[] {
  return query.apply(store.list());
}
