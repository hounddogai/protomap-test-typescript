import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptivePreferenceBudget } from "./adaptive-preference-budget.js";

/** Keeps adaptive preference budgets by code. */
export interface AdaptivePreferenceBudgetStore {
  find(code: string): AdaptivePreferenceBudget | undefined;
  save(item: AdaptivePreferenceBudget): void;
  remove(code: string): boolean;
  list(): AdaptivePreferenceBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptivePreferenceBudgetStore implements AdaptivePreferenceBudgetStore {
  items: Map<string, AdaptivePreferenceBudget>;
  order: string[];

  constructor(items: Map<string, AdaptivePreferenceBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptivePreferenceBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptivePreferenceBudget): void {
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

  list(): AdaptivePreferenceBudget[] {
    const out: AdaptivePreferenceBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptivePreferenceBudgetStore(): AdaptivePreferenceBudgetStore {
  return new MemoryAdaptivePreferenceBudgetStore(new Map<string, AdaptivePreferenceBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptivePreferenceBudgetStore implements AdaptivePreferenceBudgetStore {
  inner: AdaptivePreferenceBudgetStore;
  cache: cache.TtlCache<AdaptivePreferenceBudget>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptivePreferenceBudgetStore,
    cacheValue: cache.TtlCache<AdaptivePreferenceBudget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptivePreferenceBudget | undefined {
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

  save(item: AdaptivePreferenceBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptivePreferenceBudget[] {
    return this.inner.list();
  }
}

export function newCachedAdaptivePreferenceBudgetStore(inner: AdaptivePreferenceBudgetStore, ttl: number, clockValue: clock.Clock): AdaptivePreferenceBudgetStore {
  return new CachedAdaptivePreferenceBudgetStore(
    inner,
    cache.newTtlCache<AdaptivePreferenceBudget>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive preference budgets. Empty fields match all. */
export class AdaptivePreferenceBudgetQuery {
  label: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minSendAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptivePreferenceBudget): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptivePreferenceBudget[]): AdaptivePreferenceBudget[] {
    const matched = collections.filter(items, (candidate: AdaptivePreferenceBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptivePreferenceBudgets(store: AdaptivePreferenceBudgetStore, query: AdaptivePreferenceBudgetQuery): AdaptivePreferenceBudget[] {
  return query.apply(store.list());
}
