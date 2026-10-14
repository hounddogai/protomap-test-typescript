import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalBounceBudget } from "./regional-bounce-budget.js";

/** Keeps regional bounce budgets by code. */
export interface RegionalBounceBudgetStore {
  find(code: string): RegionalBounceBudget | undefined;
  save(item: RegionalBounceBudget): void;
  remove(code: string): boolean;
  list(): RegionalBounceBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalBounceBudgetStore implements RegionalBounceBudgetStore {
  items: Map<string, RegionalBounceBudget>;
  order: string[];

  constructor(items: Map<string, RegionalBounceBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalBounceBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalBounceBudget): void {
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

  list(): RegionalBounceBudget[] {
    const out: RegionalBounceBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalBounceBudgetStore(): RegionalBounceBudgetStore {
  return new MemoryRegionalBounceBudgetStore(new Map<string, RegionalBounceBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalBounceBudgetStore implements RegionalBounceBudgetStore {
  inner: RegionalBounceBudgetStore;
  cache: cache.TtlCache<RegionalBounceBudget>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalBounceBudgetStore,
    cacheValue: cache.TtlCache<RegionalBounceBudget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalBounceBudget | undefined {
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

  save(item: RegionalBounceBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalBounceBudget[] {
    return this.inner.list();
  }
}

export function newCachedRegionalBounceBudgetStore(inner: RegionalBounceBudgetStore, ttl: number, clockValue: clock.Clock): RegionalBounceBudgetStore {
  return new CachedRegionalBounceBudgetStore(
    inner,
    cache.newTtlCache<RegionalBounceBudget>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional bounce budgets. Empty fields match all. */
export class RegionalBounceBudgetQuery {
  source: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minOpenRate: number, statuses: string[], limit: number) {
    this.source = source;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalBounceBudget): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalBounceBudget[]): RegionalBounceBudget[] {
    const matched = collections.filter(items, (candidate: RegionalBounceBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalBounceBudgets(store: RegionalBounceBudgetStore, query: RegionalBounceBudgetQuery): RegionalBounceBudget[] {
  return query.apply(store.list());
}
