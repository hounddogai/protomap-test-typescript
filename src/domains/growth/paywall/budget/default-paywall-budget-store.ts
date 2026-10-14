import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultPaywallBudget } from "./default-paywall-budget.js";

/** Keeps default paywall budgets by code. */
export interface DefaultPaywallBudgetStore {
  find(code: string): DefaultPaywallBudget | undefined;
  save(item: DefaultPaywallBudget): void;
  remove(code: string): boolean;
  list(): DefaultPaywallBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultPaywallBudgetStore implements DefaultPaywallBudgetStore {
  items: Map<string, DefaultPaywallBudget>;
  order: string[];

  constructor(items: Map<string, DefaultPaywallBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultPaywallBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultPaywallBudget): void {
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

  list(): DefaultPaywallBudget[] {
    const out: DefaultPaywallBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultPaywallBudgetStore(): DefaultPaywallBudgetStore {
  return new MemoryDefaultPaywallBudgetStore(new Map<string, DefaultPaywallBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultPaywallBudgetStore implements DefaultPaywallBudgetStore {
  inner: DefaultPaywallBudgetStore;
  cache: cache.TtlCache<DefaultPaywallBudget>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultPaywallBudgetStore,
    cacheValue: cache.TtlCache<DefaultPaywallBudget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultPaywallBudget | undefined {
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

  save(item: DefaultPaywallBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultPaywallBudget[] {
    return this.inner.list();
  }
}

export function newCachedDefaultPaywallBudgetStore(inner: DefaultPaywallBudgetStore, ttl: number, clockValue: clock.Clock): DefaultPaywallBudgetStore {
  return new CachedDefaultPaywallBudgetStore(
    inner,
    cache.newTtlCache<DefaultPaywallBudget>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default paywall budgets. Empty fields match all. */
export class DefaultPaywallBudgetQuery {
  name: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minMaximum: number, statuses: string[], limit: number) {
    this.name = name;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultPaywallBudget): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultPaywallBudget[]): DefaultPaywallBudget[] {
    const matched = collections.filter(items, (candidate: DefaultPaywallBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultPaywallBudgets(store: DefaultPaywallBudgetStore, query: DefaultPaywallBudgetQuery): DefaultPaywallBudget[] {
  return query.apply(store.list());
}
