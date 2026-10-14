import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictReplyBudget } from "./strict-reply-budget.js";

/** Keeps strict reply budgets by code. */
export interface StrictReplyBudgetStore {
  find(code: string): StrictReplyBudget | undefined;
  save(item: StrictReplyBudget): void;
  remove(code: string): boolean;
  list(): StrictReplyBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictReplyBudgetStore implements StrictReplyBudgetStore {
  items: Map<string, StrictReplyBudget>;
  order: string[];

  constructor(items: Map<string, StrictReplyBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictReplyBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictReplyBudget): void {
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

  list(): StrictReplyBudget[] {
    const out: StrictReplyBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictReplyBudgetStore(): StrictReplyBudgetStore {
  return new MemoryStrictReplyBudgetStore(new Map<string, StrictReplyBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictReplyBudgetStore implements StrictReplyBudgetStore {
  inner: StrictReplyBudgetStore;
  cache: cache.TtlCache<StrictReplyBudget>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictReplyBudgetStore,
    cacheValue: cache.TtlCache<StrictReplyBudget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictReplyBudget | undefined {
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

  save(item: StrictReplyBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictReplyBudget[] {
    return this.inner.list();
  }
}

export function newCachedStrictReplyBudgetStore(inner: StrictReplyBudgetStore, ttl: number, clockValue: clock.Clock): StrictReplyBudgetStore {
  return new CachedStrictReplyBudgetStore(inner, cache.newTtlCache<StrictReplyBudget>(128, ttl, clockValue), 0, 0);
}

/** Selects strict reply budgets. Empty fields match all. */
export class StrictReplyBudgetQuery {
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

  matches(item: StrictReplyBudget): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictReplyBudget[]): StrictReplyBudget[] {
    const matched = collections.filter(items, (candidate: StrictReplyBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictReplyBudgets(store: StrictReplyBudgetStore, query: StrictReplyBudgetQuery): StrictReplyBudget[] {
  return query.apply(store.list());
}
