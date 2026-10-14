import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BidRuleBudget } from "./bid-rule-budget.js";

/** Keeps bid rule budgets by code. */
export interface BidRuleBudgetStore {
  find(code: string): BidRuleBudget | undefined;
  save(item: BidRuleBudget): void;
  remove(code: string): boolean;
  list(): BidRuleBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBidRuleBudgetStore implements BidRuleBudgetStore {
  items: Map<string, BidRuleBudget>;
  order: string[];

  constructor(items: Map<string, BidRuleBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BidRuleBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BidRuleBudget): void {
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

  list(): BidRuleBudget[] {
    const out: BidRuleBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBidRuleBudgetStore(): BidRuleBudgetStore {
  return new MemoryBidRuleBudgetStore(new Map<string, BidRuleBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBidRuleBudgetStore implements BidRuleBudgetStore {
  inner: BidRuleBudgetStore;
  cache: cache.TtlCache<BidRuleBudget>;
  hits: number;
  misses: number;

  constructor(inner: BidRuleBudgetStore, cacheValue: cache.TtlCache<BidRuleBudget>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BidRuleBudget | undefined {
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

  save(item: BidRuleBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BidRuleBudget[] {
    return this.inner.list();
  }
}

export function newCachedBidRuleBudgetStore(inner: BidRuleBudgetStore, ttl: number, clockValue: clock.Clock): BidRuleBudgetStore {
  return new CachedBidRuleBudgetStore(inner, cache.newTtlCache<BidRuleBudget>(512, ttl, clockValue), 0, 0);
}

/** Selects bid rule budgets. Empty fields match all. */
export class BidRuleBudgetQuery {
  region: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minWindowDays: number, statuses: string[], limit: number) {
    this.region = region;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BidRuleBudget): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BidRuleBudget[]): BidRuleBudget[] {
    const matched = collections.filter(items, (candidate: BidRuleBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBidRuleBudgets(store: BidRuleBudgetStore, query: BidRuleBudgetQuery): BidRuleBudget[] {
  return query.apply(store.list());
}
