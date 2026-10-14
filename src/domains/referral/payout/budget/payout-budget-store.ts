import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PayoutBudget } from "./payout-budget.js";

/** Keeps payout budgets by code. */
export interface PayoutBudgetStore {
  find(code: string): PayoutBudget | undefined;
  save(item: PayoutBudget): void;
  remove(code: string): boolean;
  list(): PayoutBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPayoutBudgetStore implements PayoutBudgetStore {
  items: Map<string, PayoutBudget>;
  order: string[];

  constructor(items: Map<string, PayoutBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PayoutBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PayoutBudget): void {
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

  list(): PayoutBudget[] {
    const out: PayoutBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPayoutBudgetStore(): PayoutBudgetStore {
  return new MemoryPayoutBudgetStore(new Map<string, PayoutBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPayoutBudgetStore implements PayoutBudgetStore {
  inner: PayoutBudgetStore;
  cache: cache.TtlCache<PayoutBudget>;
  hits: number;
  misses: number;

  constructor(inner: PayoutBudgetStore, cacheValue: cache.TtlCache<PayoutBudget>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PayoutBudget | undefined {
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

  save(item: PayoutBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PayoutBudget[] {
    return this.inner.list();
  }
}

export function newCachedPayoutBudgetStore(inner: PayoutBudgetStore, ttl: number, clockValue: clock.Clock): PayoutBudgetStore {
  return new CachedPayoutBudgetStore(inner, cache.newTtlCache<PayoutBudget>(512, ttl, clockValue), 0, 0);
}

/** Selects payout budgets. Empty fields match all. */
export class PayoutBudgetQuery {
  region: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.region = region;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PayoutBudget): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PayoutBudget[]): PayoutBudget[] {
    const matched = collections.filter(items, (candidate: PayoutBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPayoutBudgets(store: PayoutBudgetStore, query: PayoutBudgetQuery): PayoutBudget[] {
  return query.apply(store.list());
}
