import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveReplyBudget } from "./adaptive-reply-budget.js";

/** Keeps adaptive reply budgets by code. */
export interface AdaptiveReplyBudgetStore {
  find(code: string): AdaptiveReplyBudget | undefined;
  save(item: AdaptiveReplyBudget): void;
  remove(code: string): boolean;
  list(): AdaptiveReplyBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveReplyBudgetStore implements AdaptiveReplyBudgetStore {
  items: Map<string, AdaptiveReplyBudget>;
  order: string[];

  constructor(items: Map<string, AdaptiveReplyBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveReplyBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveReplyBudget): void {
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

  list(): AdaptiveReplyBudget[] {
    const out: AdaptiveReplyBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveReplyBudgetStore(): AdaptiveReplyBudgetStore {
  return new MemoryAdaptiveReplyBudgetStore(new Map<string, AdaptiveReplyBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveReplyBudgetStore implements AdaptiveReplyBudgetStore {
  inner: AdaptiveReplyBudgetStore;
  cache: cache.TtlCache<AdaptiveReplyBudget>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveReplyBudgetStore,
    cacheValue: cache.TtlCache<AdaptiveReplyBudget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveReplyBudget | undefined {
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

  save(item: AdaptiveReplyBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveReplyBudget[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveReplyBudgetStore(inner: AdaptiveReplyBudgetStore, ttl: number, clockValue: clock.Clock): AdaptiveReplyBudgetStore {
  return new CachedAdaptiveReplyBudgetStore(inner, cache.newTtlCache<AdaptiveReplyBudget>(64, ttl, clockValue), 0, 0);
}

/** Selects adaptive reply budgets. Empty fields match all. */
export class AdaptiveReplyBudgetQuery {
  name: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minDiscount: number, statuses: string[], limit: number) {
    this.name = name;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveReplyBudget): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveReplyBudget[]): AdaptiveReplyBudget[] {
    const matched = collections.filter(items, (candidate: AdaptiveReplyBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveReplyBudgets(store: AdaptiveReplyBudgetStore, query: AdaptiveReplyBudgetQuery): AdaptiveReplyBudget[] {
  return query.apply(store.list());
}
