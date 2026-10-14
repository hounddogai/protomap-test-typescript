import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CreativeBudget } from "./creative-budget.js";

/** Keeps creative budgets by code. */
export interface CreativeBudgetStore {
  find(code: string): CreativeBudget | undefined;
  save(item: CreativeBudget): void;
  remove(code: string): boolean;
  list(): CreativeBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCreativeBudgetStore implements CreativeBudgetStore {
  items: Map<string, CreativeBudget>;
  order: string[];

  constructor(items: Map<string, CreativeBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CreativeBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CreativeBudget): void {
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

  list(): CreativeBudget[] {
    const out: CreativeBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCreativeBudgetStore(): CreativeBudgetStore {
  return new MemoryCreativeBudgetStore(new Map<string, CreativeBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCreativeBudgetStore implements CreativeBudgetStore {
  inner: CreativeBudgetStore;
  cache: cache.TtlCache<CreativeBudget>;
  hits: number;
  misses: number;

  constructor(
    inner: CreativeBudgetStore,
    cacheValue: cache.TtlCache<CreativeBudget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CreativeBudget | undefined {
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

  save(item: CreativeBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CreativeBudget[] {
    return this.inner.list();
  }
}

export function newCachedCreativeBudgetStore(inner: CreativeBudgetStore, ttl: number, clockValue: clock.Clock): CreativeBudgetStore {
  return new CachedCreativeBudgetStore(inner, cache.newTtlCache<CreativeBudget>(128, ttl, clockValue), 0, 0);
}

/** Selects creative budgets. Empty fields match all. */
export class CreativeBudgetQuery {
  name: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minWindowDays: number, statuses: string[], limit: number) {
    this.name = name;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CreativeBudget): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CreativeBudget[]): CreativeBudget[] {
    const matched = collections.filter(items, (candidate: CreativeBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCreativeBudgets(store: CreativeBudgetStore, query: CreativeBudgetQuery): CreativeBudget[] {
  return query.apply(store.list());
}
