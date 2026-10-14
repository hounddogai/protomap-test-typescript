import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BounceBudget } from "./bounce-budget.js";

/** Keeps bounce budgets by code. */
export interface BounceBudgetStore {
  find(code: string): BounceBudget | undefined;
  save(item: BounceBudget): void;
  remove(code: string): boolean;
  list(): BounceBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBounceBudgetStore implements BounceBudgetStore {
  items: Map<string, BounceBudget>;
  order: string[];

  constructor(items: Map<string, BounceBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BounceBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BounceBudget): void {
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

  list(): BounceBudget[] {
    const out: BounceBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBounceBudgetStore(): BounceBudgetStore {
  return new MemoryBounceBudgetStore(new Map<string, BounceBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBounceBudgetStore implements BounceBudgetStore {
  inner: BounceBudgetStore;
  cache: cache.TtlCache<BounceBudget>;
  hits: number;
  misses: number;

  constructor(inner: BounceBudgetStore, cacheValue: cache.TtlCache<BounceBudget>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BounceBudget | undefined {
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

  save(item: BounceBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BounceBudget[] {
    return this.inner.list();
  }
}

export function newCachedBounceBudgetStore(inner: BounceBudgetStore, ttl: number, clockValue: clock.Clock): BounceBudgetStore {
  return new CachedBounceBudgetStore(inner, cache.newTtlCache<BounceBudget>(256, ttl, clockValue), 0, 0);
}

/** Selects bounce budgets. Empty fields match all. */
export class BounceBudgetQuery {
  channel: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minCapacity: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BounceBudget): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BounceBudget[]): BounceBudget[] {
    const matched = collections.filter(items, (candidate: BounceBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBounceBudgets(store: BounceBudgetStore, query: BounceBudgetQuery): BounceBudget[] {
  return query.apply(store.list());
}
