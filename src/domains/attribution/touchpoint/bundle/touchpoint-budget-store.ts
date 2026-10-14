import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TouchpointBudget } from "./touchpoint-budget.js";

/** Keeps touchpoint budgets by code. */
export interface TouchpointBudgetStore {
  find(code: string): TouchpointBudget | undefined;
  save(item: TouchpointBudget): void;
  remove(code: string): boolean;
  list(): TouchpointBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTouchpointBudgetStore implements TouchpointBudgetStore {
  items: Map<string, TouchpointBudget>;
  order: string[];

  constructor(items: Map<string, TouchpointBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TouchpointBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TouchpointBudget): void {
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

  list(): TouchpointBudget[] {
    const out: TouchpointBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTouchpointBudgetStore(): TouchpointBudgetStore {
  return new MemoryTouchpointBudgetStore(new Map<string, TouchpointBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTouchpointBudgetStore implements TouchpointBudgetStore {
  inner: TouchpointBudgetStore;
  cache: cache.TtlCache<TouchpointBudget>;
  hits: number;
  misses: number;

  constructor(
    inner: TouchpointBudgetStore,
    cacheValue: cache.TtlCache<TouchpointBudget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TouchpointBudget | undefined {
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

  save(item: TouchpointBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TouchpointBudget[] {
    return this.inner.list();
  }
}

export function newCachedTouchpointBudgetStore(inner: TouchpointBudgetStore, ttl: number, clockValue: clock.Clock): TouchpointBudgetStore {
  return new CachedTouchpointBudgetStore(inner, cache.newTtlCache<TouchpointBudget>(1024, ttl, clockValue), 0, 0);
}

/** Selects touchpoint budgets. Empty fields match all. */
export class TouchpointBudgetQuery {
  channel: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TouchpointBudget): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TouchpointBudget[]): TouchpointBudget[] {
    const matched = collections.filter(items, (candidate: TouchpointBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTouchpointBudgets(store: TouchpointBudgetStore, query: TouchpointBudgetQuery): TouchpointBudget[] {
  return query.apply(store.list());
}
