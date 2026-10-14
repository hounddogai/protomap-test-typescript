import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultDeflectionBudget } from "./default-deflection-budget.js";

/** Keeps default deflection budgets by code. */
export interface DefaultDeflectionBudgetStore {
  find(code: string): DefaultDeflectionBudget | undefined;
  save(item: DefaultDeflectionBudget): void;
  remove(code: string): boolean;
  list(): DefaultDeflectionBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultDeflectionBudgetStore implements DefaultDeflectionBudgetStore {
  items: Map<string, DefaultDeflectionBudget>;
  order: string[];

  constructor(items: Map<string, DefaultDeflectionBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultDeflectionBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultDeflectionBudget): void {
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

  list(): DefaultDeflectionBudget[] {
    const out: DefaultDeflectionBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultDeflectionBudgetStore(): DefaultDeflectionBudgetStore {
  return new MemoryDefaultDeflectionBudgetStore(new Map<string, DefaultDeflectionBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultDeflectionBudgetStore implements DefaultDeflectionBudgetStore {
  inner: DefaultDeflectionBudgetStore;
  cache: cache.TtlCache<DefaultDeflectionBudget>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultDeflectionBudgetStore,
    cacheValue: cache.TtlCache<DefaultDeflectionBudget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultDeflectionBudget | undefined {
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

  save(item: DefaultDeflectionBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultDeflectionBudget[] {
    return this.inner.list();
  }
}

export function newCachedDefaultDeflectionBudgetStore(inner: DefaultDeflectionBudgetStore, ttl: number, clockValue: clock.Clock): DefaultDeflectionBudgetStore {
  return new CachedDefaultDeflectionBudgetStore(
    inner,
    cache.newTtlCache<DefaultDeflectionBudget>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default deflection budgets. Empty fields match all. */
export class DefaultDeflectionBudgetQuery {
  region: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minOpenRate: number, statuses: string[], limit: number) {
    this.region = region;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultDeflectionBudget): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultDeflectionBudget[]): DefaultDeflectionBudget[] {
    const matched = collections.filter(items, (candidate: DefaultDeflectionBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultDeflectionBudgets(store: DefaultDeflectionBudgetStore, query: DefaultDeflectionBudgetQuery): DefaultDeflectionBudget[] {
  return query.apply(store.list());
}
