import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalTouchpointBudget } from "./regional-touchpoint-budget.js";

/** Keeps regional touchpoint budgets by code. */
export interface RegionalTouchpointBudgetStore {
  find(code: string): RegionalTouchpointBudget | undefined;
  save(item: RegionalTouchpointBudget): void;
  remove(code: string): boolean;
  list(): RegionalTouchpointBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalTouchpointBudgetStore implements RegionalTouchpointBudgetStore {
  items: Map<string, RegionalTouchpointBudget>;
  order: string[];

  constructor(items: Map<string, RegionalTouchpointBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalTouchpointBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalTouchpointBudget): void {
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

  list(): RegionalTouchpointBudget[] {
    const out: RegionalTouchpointBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalTouchpointBudgetStore(): RegionalTouchpointBudgetStore {
  return new MemoryRegionalTouchpointBudgetStore(new Map<string, RegionalTouchpointBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalTouchpointBudgetStore implements RegionalTouchpointBudgetStore {
  inner: RegionalTouchpointBudgetStore;
  cache: cache.TtlCache<RegionalTouchpointBudget>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalTouchpointBudgetStore,
    cacheValue: cache.TtlCache<RegionalTouchpointBudget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalTouchpointBudget | undefined {
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

  save(item: RegionalTouchpointBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalTouchpointBudget[] {
    return this.inner.list();
  }
}

export function newCachedRegionalTouchpointBudgetStore(inner: RegionalTouchpointBudgetStore, ttl: number, clockValue: clock.Clock): RegionalTouchpointBudgetStore {
  return new CachedRegionalTouchpointBudgetStore(
    inner,
    cache.newTtlCache<RegionalTouchpointBudget>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional touchpoint budgets. Empty fields match all. */
export class RegionalTouchpointBudgetQuery {
  title: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minQuantity: number, statuses: string[], limit: number) {
    this.title = title;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalTouchpointBudget): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalTouchpointBudget[]): RegionalTouchpointBudget[] {
    const matched = collections.filter(items, (candidate: RegionalTouchpointBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalTouchpointBudgets(store: RegionalTouchpointBudgetStore, query: RegionalTouchpointBudgetQuery): RegionalTouchpointBudget[] {
  return query.apply(store.list());
}
