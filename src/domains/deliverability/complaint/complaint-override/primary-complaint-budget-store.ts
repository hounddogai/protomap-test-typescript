import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryComplaintBudget } from "./primary-complaint-budget.js";

/** Keeps primary complaint budgets by code. */
export interface PrimaryComplaintBudgetStore {
  find(code: string): PrimaryComplaintBudget | undefined;
  save(item: PrimaryComplaintBudget): void;
  remove(code: string): boolean;
  list(): PrimaryComplaintBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryComplaintBudgetStore implements PrimaryComplaintBudgetStore {
  items: Map<string, PrimaryComplaintBudget>;
  order: string[];

  constructor(items: Map<string, PrimaryComplaintBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryComplaintBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryComplaintBudget): void {
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

  list(): PrimaryComplaintBudget[] {
    const out: PrimaryComplaintBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryComplaintBudgetStore(): PrimaryComplaintBudgetStore {
  return new MemoryPrimaryComplaintBudgetStore(new Map<string, PrimaryComplaintBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryComplaintBudgetStore implements PrimaryComplaintBudgetStore {
  inner: PrimaryComplaintBudgetStore;
  cache: cache.TtlCache<PrimaryComplaintBudget>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryComplaintBudgetStore,
    cacheValue: cache.TtlCache<PrimaryComplaintBudget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryComplaintBudget | undefined {
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

  save(item: PrimaryComplaintBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryComplaintBudget[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryComplaintBudgetStore(inner: PrimaryComplaintBudgetStore, ttl: number, clockValue: clock.Clock): PrimaryComplaintBudgetStore {
  return new CachedPrimaryComplaintBudgetStore(
    inner,
    cache.newTtlCache<PrimaryComplaintBudget>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary complaint budgets. Empty fields match all. */
export class PrimaryComplaintBudgetQuery {
  utmSource: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minDiscount: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryComplaintBudget): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryComplaintBudget[]): PrimaryComplaintBudget[] {
    const matched = collections.filter(items, (candidate: PrimaryComplaintBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryComplaintBudgets(store: PrimaryComplaintBudgetStore, query: PrimaryComplaintBudgetQuery): PrimaryComplaintBudget[] {
  return query.apply(store.list());
}
