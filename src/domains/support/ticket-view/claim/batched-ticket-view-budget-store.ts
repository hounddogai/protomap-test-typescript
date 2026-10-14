import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedTicketViewBudget } from "./batched-ticket-view-budget.js";

/** Keeps batched ticket view budgets by code. */
export interface BatchedTicketViewBudgetStore {
  find(code: string): BatchedTicketViewBudget | undefined;
  save(item: BatchedTicketViewBudget): void;
  remove(code: string): boolean;
  list(): BatchedTicketViewBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedTicketViewBudgetStore implements BatchedTicketViewBudgetStore {
  items: Map<string, BatchedTicketViewBudget>;
  order: string[];

  constructor(items: Map<string, BatchedTicketViewBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedTicketViewBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedTicketViewBudget): void {
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

  list(): BatchedTicketViewBudget[] {
    const out: BatchedTicketViewBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedTicketViewBudgetStore(): BatchedTicketViewBudgetStore {
  return new MemoryBatchedTicketViewBudgetStore(new Map<string, BatchedTicketViewBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedTicketViewBudgetStore implements BatchedTicketViewBudgetStore {
  inner: BatchedTicketViewBudgetStore;
  cache: cache.TtlCache<BatchedTicketViewBudget>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedTicketViewBudgetStore,
    cacheValue: cache.TtlCache<BatchedTicketViewBudget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedTicketViewBudget | undefined {
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

  save(item: BatchedTicketViewBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedTicketViewBudget[] {
    return this.inner.list();
  }
}

export function newCachedBatchedTicketViewBudgetStore(inner: BatchedTicketViewBudgetStore, ttl: number, clockValue: clock.Clock): BatchedTicketViewBudgetStore {
  return new CachedBatchedTicketViewBudgetStore(
    inner,
    cache.newTtlCache<BatchedTicketViewBudget>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched ticket view budgets. Empty fields match all. */
export class BatchedTicketViewBudgetQuery {
  label: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minQuantity: number, statuses: string[], limit: number) {
    this.label = label;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedTicketViewBudget): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedTicketViewBudget[]): BatchedTicketViewBudget[] {
    const matched = collections.filter(items, (candidate: BatchedTicketViewBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedTicketViewBudgets(store: BatchedTicketViewBudgetStore, query: BatchedTicketViewBudgetQuery): BatchedTicketViewBudget[] {
  return query.apply(store.list());
}
