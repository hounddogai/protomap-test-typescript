import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LevelBudget } from "./level-budget.js";

/** Keeps level budgets by code. */
export interface LevelBudgetStore {
  find(code: string): LevelBudget | undefined;
  save(item: LevelBudget): void;
  remove(code: string): boolean;
  list(): LevelBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLevelBudgetStore implements LevelBudgetStore {
  items: Map<string, LevelBudget>;
  order: string[];

  constructor(items: Map<string, LevelBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LevelBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LevelBudget): void {
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

  list(): LevelBudget[] {
    const out: LevelBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLevelBudgetStore(): LevelBudgetStore {
  return new MemoryLevelBudgetStore(new Map<string, LevelBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLevelBudgetStore implements LevelBudgetStore {
  inner: LevelBudgetStore;
  cache: cache.TtlCache<LevelBudget>;
  hits: number;
  misses: number;

  constructor(inner: LevelBudgetStore, cacheValue: cache.TtlCache<LevelBudget>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LevelBudget | undefined {
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

  save(item: LevelBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LevelBudget[] {
    return this.inner.list();
  }
}

export function newCachedLevelBudgetStore(inner: LevelBudgetStore, ttl: number, clockValue: clock.Clock): LevelBudgetStore {
  return new CachedLevelBudgetStore(inner, cache.newTtlCache<LevelBudget>(64, ttl, clockValue), 0, 0);
}

/** Selects level budgets. Empty fields match all. */
export class LevelBudgetQuery {
  title: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minPriority: number, statuses: string[], limit: number) {
    this.title = title;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LevelBudget): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LevelBudget[]): LevelBudget[] {
    const matched = collections.filter(items, (candidate: LevelBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLevelBudgets(store: LevelBudgetStore, query: LevelBudgetQuery): LevelBudget[] {
  return query.apply(store.list());
}
