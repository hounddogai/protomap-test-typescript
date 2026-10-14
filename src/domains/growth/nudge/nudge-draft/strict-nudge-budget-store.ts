import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictNudgeBudget } from "./strict-nudge-budget.js";

/** Keeps strict nudge budgets by code. */
export interface StrictNudgeBudgetStore {
  find(code: string): StrictNudgeBudget | undefined;
  save(item: StrictNudgeBudget): void;
  remove(code: string): boolean;
  list(): StrictNudgeBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictNudgeBudgetStore implements StrictNudgeBudgetStore {
  items: Map<string, StrictNudgeBudget>;
  order: string[];

  constructor(items: Map<string, StrictNudgeBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictNudgeBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictNudgeBudget): void {
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

  list(): StrictNudgeBudget[] {
    const out: StrictNudgeBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictNudgeBudgetStore(): StrictNudgeBudgetStore {
  return new MemoryStrictNudgeBudgetStore(new Map<string, StrictNudgeBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictNudgeBudgetStore implements StrictNudgeBudgetStore {
  inner: StrictNudgeBudgetStore;
  cache: cache.TtlCache<StrictNudgeBudget>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictNudgeBudgetStore,
    cacheValue: cache.TtlCache<StrictNudgeBudget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictNudgeBudget | undefined {
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

  save(item: StrictNudgeBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictNudgeBudget[] {
    return this.inner.list();
  }
}

export function newCachedStrictNudgeBudgetStore(inner: StrictNudgeBudgetStore, ttl: number, clockValue: clock.Clock): StrictNudgeBudgetStore {
  return new CachedStrictNudgeBudgetStore(inner, cache.newTtlCache<StrictNudgeBudget>(1024, ttl, clockValue), 0, 0);
}

/** Selects strict nudge budgets. Empty fields match all. */
export class StrictNudgeBudgetQuery {
  title: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minRetries: number, statuses: string[], limit: number) {
    this.title = title;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictNudgeBudget): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictNudgeBudget[]): StrictNudgeBudget[] {
    const matched = collections.filter(items, (candidate: StrictNudgeBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictNudgeBudgets(store: StrictNudgeBudgetStore, query: StrictNudgeBudgetQuery): StrictNudgeBudget[] {
  return query.apply(store.list());
}
