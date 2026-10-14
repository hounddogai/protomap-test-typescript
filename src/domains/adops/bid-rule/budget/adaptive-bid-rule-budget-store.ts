import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveBidRuleBudget } from "./adaptive-bid-rule-budget.js";

/** Keeps adaptive bid rule budgets by code. */
export interface AdaptiveBidRuleBudgetStore {
  find(code: string): AdaptiveBidRuleBudget | undefined;
  save(item: AdaptiveBidRuleBudget): void;
  remove(code: string): boolean;
  list(): AdaptiveBidRuleBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveBidRuleBudgetStore implements AdaptiveBidRuleBudgetStore {
  items: Map<string, AdaptiveBidRuleBudget>;
  order: string[];

  constructor(items: Map<string, AdaptiveBidRuleBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveBidRuleBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveBidRuleBudget): void {
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

  list(): AdaptiveBidRuleBudget[] {
    const out: AdaptiveBidRuleBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveBidRuleBudgetStore(): AdaptiveBidRuleBudgetStore {
  return new MemoryAdaptiveBidRuleBudgetStore(new Map<string, AdaptiveBidRuleBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveBidRuleBudgetStore implements AdaptiveBidRuleBudgetStore {
  inner: AdaptiveBidRuleBudgetStore;
  cache: cache.TtlCache<AdaptiveBidRuleBudget>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveBidRuleBudgetStore,
    cacheValue: cache.TtlCache<AdaptiveBidRuleBudget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveBidRuleBudget | undefined {
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

  save(item: AdaptiveBidRuleBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveBidRuleBudget[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveBidRuleBudgetStore(inner: AdaptiveBidRuleBudgetStore, ttl: number, clockValue: clock.Clock): AdaptiveBidRuleBudgetStore {
  return new CachedAdaptiveBidRuleBudgetStore(
    inner,
    cache.newTtlCache<AdaptiveBidRuleBudget>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive bid rule budgets. Empty fields match all. */
export class AdaptiveBidRuleBudgetQuery {
  channel: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minBudget: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveBidRuleBudget): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveBidRuleBudget[]): AdaptiveBidRuleBudget[] {
    const matched = collections.filter(items, (candidate: AdaptiveBidRuleBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveBidRuleBudgets(store: AdaptiveBidRuleBudgetStore, query: AdaptiveBidRuleBudgetQuery): AdaptiveBidRuleBudget[] {
  return query.apply(store.list());
}
