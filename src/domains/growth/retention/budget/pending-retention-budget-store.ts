import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingRetentionBudget } from "./pending-retention-budget.js";

/** Keeps pending retention budgets by code. */
export interface PendingRetentionBudgetStore {
  find(code: string): PendingRetentionBudget | undefined;
  save(item: PendingRetentionBudget): void;
  remove(code: string): boolean;
  list(): PendingRetentionBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingRetentionBudgetStore implements PendingRetentionBudgetStore {
  items: Map<string, PendingRetentionBudget>;
  order: string[];

  constructor(items: Map<string, PendingRetentionBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingRetentionBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingRetentionBudget): void {
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

  list(): PendingRetentionBudget[] {
    const out: PendingRetentionBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingRetentionBudgetStore(): PendingRetentionBudgetStore {
  return new MemoryPendingRetentionBudgetStore(new Map<string, PendingRetentionBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingRetentionBudgetStore implements PendingRetentionBudgetStore {
  inner: PendingRetentionBudgetStore;
  cache: cache.TtlCache<PendingRetentionBudget>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingRetentionBudgetStore,
    cacheValue: cache.TtlCache<PendingRetentionBudget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingRetentionBudget | undefined {
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

  save(item: PendingRetentionBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingRetentionBudget[] {
    return this.inner.list();
  }
}

export function newCachedPendingRetentionBudgetStore(inner: PendingRetentionBudgetStore, ttl: number, clockValue: clock.Clock): PendingRetentionBudgetStore {
  return new CachedPendingRetentionBudgetStore(
    inner,
    cache.newTtlCache<PendingRetentionBudget>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending retention budgets. Empty fields match all. */
export class PendingRetentionBudgetQuery {
  region: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minAttempts: number, statuses: string[], limit: number) {
    this.region = region;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingRetentionBudget): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingRetentionBudget[]): PendingRetentionBudget[] {
    const matched = collections.filter(items, (candidate: PendingRetentionBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingRetentionBudgets(store: PendingRetentionBudgetStore, query: PendingRetentionBudgetQuery): PendingRetentionBudget[] {
  return query.apply(store.list());
}
