import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackModelBudget } from "./fallback-model-budget.js";

/** Keeps fallback model budgets by code. */
export interface FallbackModelBudgetStore {
  find(code: string): FallbackModelBudget | undefined;
  save(item: FallbackModelBudget): void;
  remove(code: string): boolean;
  list(): FallbackModelBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackModelBudgetStore implements FallbackModelBudgetStore {
  items: Map<string, FallbackModelBudget>;
  order: string[];

  constructor(items: Map<string, FallbackModelBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackModelBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackModelBudget): void {
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

  list(): FallbackModelBudget[] {
    const out: FallbackModelBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackModelBudgetStore(): FallbackModelBudgetStore {
  return new MemoryFallbackModelBudgetStore(new Map<string, FallbackModelBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackModelBudgetStore implements FallbackModelBudgetStore {
  inner: FallbackModelBudgetStore;
  cache: cache.TtlCache<FallbackModelBudget>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackModelBudgetStore,
    cacheValue: cache.TtlCache<FallbackModelBudget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackModelBudget | undefined {
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

  save(item: FallbackModelBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackModelBudget[] {
    return this.inner.list();
  }
}

export function newCachedFallbackModelBudgetStore(inner: FallbackModelBudgetStore, ttl: number, clockValue: clock.Clock): FallbackModelBudgetStore {
  return new CachedFallbackModelBudgetStore(inner, cache.newTtlCache<FallbackModelBudget>(256, ttl, clockValue), 0, 0);
}

/** Selects fallback model budgets. Empty fields match all. */
export class FallbackModelBudgetQuery {
  utmSource: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minSequence: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackModelBudget): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackModelBudget[]): FallbackModelBudget[] {
    const matched = collections.filter(items, (candidate: FallbackModelBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackModelBudgets(store: FallbackModelBudgetStore, query: FallbackModelBudgetQuery): FallbackModelBudget[] {
  return query.apply(store.list());
}
