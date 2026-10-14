import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RewardBudget } from "./reward-budget.js";

/** Keeps reward budgets by code. */
export interface RewardBudgetStore {
  find(code: string): RewardBudget | undefined;
  save(item: RewardBudget): void;
  remove(code: string): boolean;
  list(): RewardBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRewardBudgetStore implements RewardBudgetStore {
  items: Map<string, RewardBudget>;
  order: string[];

  constructor(items: Map<string, RewardBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RewardBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RewardBudget): void {
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

  list(): RewardBudget[] {
    const out: RewardBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRewardBudgetStore(): RewardBudgetStore {
  return new MemoryRewardBudgetStore(new Map<string, RewardBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRewardBudgetStore implements RewardBudgetStore {
  inner: RewardBudgetStore;
  cache: cache.TtlCache<RewardBudget>;
  hits: number;
  misses: number;

  constructor(inner: RewardBudgetStore, cacheValue: cache.TtlCache<RewardBudget>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RewardBudget | undefined {
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

  save(item: RewardBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RewardBudget[] {
    return this.inner.list();
  }
}

export function newCachedRewardBudgetStore(inner: RewardBudgetStore, ttl: number, clockValue: clock.Clock): RewardBudgetStore {
  return new CachedRewardBudgetStore(inner, cache.newTtlCache<RewardBudget>(1024, ttl, clockValue), 0, 0);
}

/** Selects reward budgets. Empty fields match all. */
export class RewardBudgetQuery {
  label: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minFloorValue: number, statuses: string[], limit: number) {
    this.label = label;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RewardBudget): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RewardBudget[]): RewardBudget[] {
    const matched = collections.filter(items, (candidate: RewardBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRewardBudgets(store: RewardBudgetStore, query: RewardBudgetQuery): RewardBudget[] {
  return query.apply(store.list());
}
