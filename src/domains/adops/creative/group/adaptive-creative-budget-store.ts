import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveCreativeBudget } from "./adaptive-creative-budget.js";

/** Keeps adaptive creative budgets by code. */
export interface AdaptiveCreativeBudgetStore {
  find(code: string): AdaptiveCreativeBudget | undefined;
  save(item: AdaptiveCreativeBudget): void;
  remove(code: string): boolean;
  list(): AdaptiveCreativeBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveCreativeBudgetStore implements AdaptiveCreativeBudgetStore {
  items: Map<string, AdaptiveCreativeBudget>;
  order: string[];

  constructor(items: Map<string, AdaptiveCreativeBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveCreativeBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveCreativeBudget): void {
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

  list(): AdaptiveCreativeBudget[] {
    const out: AdaptiveCreativeBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveCreativeBudgetStore(): AdaptiveCreativeBudgetStore {
  return new MemoryAdaptiveCreativeBudgetStore(new Map<string, AdaptiveCreativeBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveCreativeBudgetStore implements AdaptiveCreativeBudgetStore {
  inner: AdaptiveCreativeBudgetStore;
  cache: cache.TtlCache<AdaptiveCreativeBudget>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveCreativeBudgetStore,
    cacheValue: cache.TtlCache<AdaptiveCreativeBudget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveCreativeBudget | undefined {
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

  save(item: AdaptiveCreativeBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveCreativeBudget[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveCreativeBudgetStore(inner: AdaptiveCreativeBudgetStore, ttl: number, clockValue: clock.Clock): AdaptiveCreativeBudgetStore {
  return new CachedAdaptiveCreativeBudgetStore(
    inner,
    cache.newTtlCache<AdaptiveCreativeBudget>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive creative budgets. Empty fields match all. */
export class AdaptiveCreativeBudgetQuery {
  title: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minBatchSize: number, statuses: string[], limit: number) {
    this.title = title;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveCreativeBudget): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveCreativeBudget[]): AdaptiveCreativeBudget[] {
    const matched = collections.filter(items, (candidate: AdaptiveCreativeBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveCreativeBudgets(store: AdaptiveCreativeBudgetStore, query: AdaptiveCreativeBudgetQuery): AdaptiveCreativeBudget[] {
  return query.apply(store.list());
}
