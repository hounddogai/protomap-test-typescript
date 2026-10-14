import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackReplyBudget } from "./fallback-reply-budget.js";

/** Keeps fallback reply budgets by code. */
export interface FallbackReplyBudgetStore {
  find(code: string): FallbackReplyBudget | undefined;
  save(item: FallbackReplyBudget): void;
  remove(code: string): boolean;
  list(): FallbackReplyBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackReplyBudgetStore implements FallbackReplyBudgetStore {
  items: Map<string, FallbackReplyBudget>;
  order: string[];

  constructor(items: Map<string, FallbackReplyBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackReplyBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackReplyBudget): void {
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

  list(): FallbackReplyBudget[] {
    const out: FallbackReplyBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackReplyBudgetStore(): FallbackReplyBudgetStore {
  return new MemoryFallbackReplyBudgetStore(new Map<string, FallbackReplyBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackReplyBudgetStore implements FallbackReplyBudgetStore {
  inner: FallbackReplyBudgetStore;
  cache: cache.TtlCache<FallbackReplyBudget>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackReplyBudgetStore,
    cacheValue: cache.TtlCache<FallbackReplyBudget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackReplyBudget | undefined {
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

  save(item: FallbackReplyBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackReplyBudget[] {
    return this.inner.list();
  }
}

export function newCachedFallbackReplyBudgetStore(inner: FallbackReplyBudgetStore, ttl: number, clockValue: clock.Clock): FallbackReplyBudgetStore {
  return new CachedFallbackReplyBudgetStore(inner, cache.newTtlCache<FallbackReplyBudget>(1024, ttl, clockValue), 0, 0);
}

/** Selects fallback reply budgets. Empty fields match all. */
export class FallbackReplyBudgetQuery {
  locale: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minDiscount: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackReplyBudget): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackReplyBudget[]): FallbackReplyBudget[] {
    const matched = collections.filter(items, (candidate: FallbackReplyBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackReplyBudgets(store: FallbackReplyBudgetStore, query: FallbackReplyBudgetQuery): FallbackReplyBudget[] {
  return query.apply(store.list());
}
