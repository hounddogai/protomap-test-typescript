import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalTicketViewBudget } from "./regional-ticket-view-budget.js";

/** Keeps regional ticket view budgets by code. */
export interface RegionalTicketViewBudgetStore {
  find(code: string): RegionalTicketViewBudget | undefined;
  save(item: RegionalTicketViewBudget): void;
  remove(code: string): boolean;
  list(): RegionalTicketViewBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalTicketViewBudgetStore implements RegionalTicketViewBudgetStore {
  items: Map<string, RegionalTicketViewBudget>;
  order: string[];

  constructor(items: Map<string, RegionalTicketViewBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalTicketViewBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalTicketViewBudget): void {
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

  list(): RegionalTicketViewBudget[] {
    const out: RegionalTicketViewBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalTicketViewBudgetStore(): RegionalTicketViewBudgetStore {
  return new MemoryRegionalTicketViewBudgetStore(new Map<string, RegionalTicketViewBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalTicketViewBudgetStore implements RegionalTicketViewBudgetStore {
  inner: RegionalTicketViewBudgetStore;
  cache: cache.TtlCache<RegionalTicketViewBudget>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalTicketViewBudgetStore,
    cacheValue: cache.TtlCache<RegionalTicketViewBudget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalTicketViewBudget | undefined {
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

  save(item: RegionalTicketViewBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalTicketViewBudget[] {
    return this.inner.list();
  }
}

export function newCachedRegionalTicketViewBudgetStore(inner: RegionalTicketViewBudgetStore, ttl: number, clockValue: clock.Clock): RegionalTicketViewBudgetStore {
  return new CachedRegionalTicketViewBudgetStore(
    inner,
    cache.newTtlCache<RegionalTicketViewBudget>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional ticket view budgets. Empty fields match all. */
export class RegionalTicketViewBudgetQuery {
  locale: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minGraceDays: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalTicketViewBudget): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalTicketViewBudget[]): RegionalTicketViewBudget[] {
    const matched = collections.filter(items, (candidate: RegionalTicketViewBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalTicketViewBudgets(store: RegionalTicketViewBudgetStore, query: RegionalTicketViewBudgetQuery): RegionalTicketViewBudget[] {
  return query.apply(store.list());
}
