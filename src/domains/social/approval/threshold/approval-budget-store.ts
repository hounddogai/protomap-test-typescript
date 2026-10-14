import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ApprovalBudget } from "./approval-budget.js";

/** Keeps approval budgets by code. */
export interface ApprovalBudgetStore {
  find(code: string): ApprovalBudget | undefined;
  save(item: ApprovalBudget): void;
  remove(code: string): boolean;
  list(): ApprovalBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryApprovalBudgetStore implements ApprovalBudgetStore {
  items: Map<string, ApprovalBudget>;
  order: string[];

  constructor(items: Map<string, ApprovalBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ApprovalBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ApprovalBudget): void {
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

  list(): ApprovalBudget[] {
    const out: ApprovalBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryApprovalBudgetStore(): ApprovalBudgetStore {
  return new MemoryApprovalBudgetStore(new Map<string, ApprovalBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedApprovalBudgetStore implements ApprovalBudgetStore {
  inner: ApprovalBudgetStore;
  cache: cache.TtlCache<ApprovalBudget>;
  hits: number;
  misses: number;

  constructor(
    inner: ApprovalBudgetStore,
    cacheValue: cache.TtlCache<ApprovalBudget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ApprovalBudget | undefined {
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

  save(item: ApprovalBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ApprovalBudget[] {
    return this.inner.list();
  }
}

export function newCachedApprovalBudgetStore(inner: ApprovalBudgetStore, ttl: number, clockValue: clock.Clock): ApprovalBudgetStore {
  return new CachedApprovalBudgetStore(inner, cache.newTtlCache<ApprovalBudget>(1024, ttl, clockValue), 0, 0);
}

/** Selects approval budgets. Empty fields match all. */
export class ApprovalBudgetQuery {
  source: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minPriority: number, statuses: string[], limit: number) {
    this.source = source;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ApprovalBudget): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ApprovalBudget[]): ApprovalBudget[] {
    const matched = collections.filter(items, (candidate: ApprovalBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findApprovalBudgets(store: ApprovalBudgetStore, query: ApprovalBudgetQuery): ApprovalBudget[] {
  return query.apply(store.list());
}
