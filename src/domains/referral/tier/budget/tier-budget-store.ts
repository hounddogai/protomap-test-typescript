import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TierBudget } from "./tier-budget.js";

/** Keeps tier budgets by code. */
export interface TierBudgetStore {
  find(code: string): TierBudget | undefined;
  save(item: TierBudget): void;
  remove(code: string): boolean;
  list(): TierBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTierBudgetStore implements TierBudgetStore {
  items: Map<string, TierBudget>;
  order: string[];

  constructor(items: Map<string, TierBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TierBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TierBudget): void {
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

  list(): TierBudget[] {
    const out: TierBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTierBudgetStore(): TierBudgetStore {
  return new MemoryTierBudgetStore(new Map<string, TierBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTierBudgetStore implements TierBudgetStore {
  inner: TierBudgetStore;
  cache: cache.TtlCache<TierBudget>;
  hits: number;
  misses: number;

  constructor(inner: TierBudgetStore, cacheValue: cache.TtlCache<TierBudget>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TierBudget | undefined {
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

  save(item: TierBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TierBudget[] {
    return this.inner.list();
  }
}

export function newCachedTierBudgetStore(inner: TierBudgetStore, ttl: number, clockValue: clock.Clock): TierBudgetStore {
  return new CachedTierBudgetStore(inner, cache.newTtlCache<TierBudget>(1024, ttl, clockValue), 0, 0);
}

/** Selects tier budgets. Empty fields match all. */
export class TierBudgetQuery {
  label: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minBid: number, statuses: string[], limit: number) {
    this.label = label;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TierBudget): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TierBudget[]): TierBudget[] {
    const matched = collections.filter(items, (candidate: TierBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTierBudgets(store: TierBudgetStore, query: TierBudgetQuery): TierBudget[] {
  return query.apply(store.list());
}
