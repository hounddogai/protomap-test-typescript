import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackBadgeBudget } from "./fallback-badge-budget.js";

/** Keeps fallback badge budgets by code. */
export interface FallbackBadgeBudgetStore {
  find(code: string): FallbackBadgeBudget | undefined;
  save(item: FallbackBadgeBudget): void;
  remove(code: string): boolean;
  list(): FallbackBadgeBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackBadgeBudgetStore implements FallbackBadgeBudgetStore {
  items: Map<string, FallbackBadgeBudget>;
  order: string[];

  constructor(items: Map<string, FallbackBadgeBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackBadgeBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackBadgeBudget): void {
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

  list(): FallbackBadgeBudget[] {
    const out: FallbackBadgeBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackBadgeBudgetStore(): FallbackBadgeBudgetStore {
  return new MemoryFallbackBadgeBudgetStore(new Map<string, FallbackBadgeBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackBadgeBudgetStore implements FallbackBadgeBudgetStore {
  inner: FallbackBadgeBudgetStore;
  cache: cache.TtlCache<FallbackBadgeBudget>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackBadgeBudgetStore,
    cacheValue: cache.TtlCache<FallbackBadgeBudget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackBadgeBudget | undefined {
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

  save(item: FallbackBadgeBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackBadgeBudget[] {
    return this.inner.list();
  }
}

export function newCachedFallbackBadgeBudgetStore(inner: FallbackBadgeBudgetStore, ttl: number, clockValue: clock.Clock): FallbackBadgeBudgetStore {
  return new CachedFallbackBadgeBudgetStore(inner, cache.newTtlCache<FallbackBadgeBudget>(256, ttl, clockValue), 0, 0);
}

/** Selects fallback badge budgets. Empty fields match all. */
export class FallbackBadgeBudgetQuery {
  title: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minPriority: number, statuses: string[], limit: number) {
    this.title = title;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackBadgeBudget): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackBadgeBudget[]): FallbackBadgeBudget[] {
    const matched = collections.filter(items, (candidate: FallbackBadgeBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackBadgeBudgets(store: FallbackBadgeBudgetStore, query: FallbackBadgeBudgetQuery): FallbackBadgeBudget[] {
  return query.apply(store.list());
}
