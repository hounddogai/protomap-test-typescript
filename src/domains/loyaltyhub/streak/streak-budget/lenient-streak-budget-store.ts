import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientStreakBudget } from "./lenient-streak-budget.js";

/** Keeps lenient streak budgets by code. */
export interface LenientStreakBudgetStore {
  find(code: string): LenientStreakBudget | undefined;
  save(item: LenientStreakBudget): void;
  remove(code: string): boolean;
  list(): LenientStreakBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientStreakBudgetStore implements LenientStreakBudgetStore {
  items: Map<string, LenientStreakBudget>;
  order: string[];

  constructor(items: Map<string, LenientStreakBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientStreakBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientStreakBudget): void {
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

  list(): LenientStreakBudget[] {
    const out: LenientStreakBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientStreakBudgetStore(): LenientStreakBudgetStore {
  return new MemoryLenientStreakBudgetStore(new Map<string, LenientStreakBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientStreakBudgetStore implements LenientStreakBudgetStore {
  inner: LenientStreakBudgetStore;
  cache: cache.TtlCache<LenientStreakBudget>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientStreakBudgetStore,
    cacheValue: cache.TtlCache<LenientStreakBudget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientStreakBudget | undefined {
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

  save(item: LenientStreakBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientStreakBudget[] {
    return this.inner.list();
  }
}

export function newCachedLenientStreakBudgetStore(inner: LenientStreakBudgetStore, ttl: number, clockValue: clock.Clock): LenientStreakBudgetStore {
  return new CachedLenientStreakBudgetStore(inner, cache.newTtlCache<LenientStreakBudget>(512, ttl, clockValue), 0, 0);
}

/** Selects lenient streak budgets. Empty fields match all. */
export class LenientStreakBudgetQuery {
  channel: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minPriority: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientStreakBudget): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientStreakBudget[]): LenientStreakBudget[] {
    const matched = collections.filter(items, (candidate: LenientStreakBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientStreakBudgets(store: LenientStreakBudgetStore, query: LenientStreakBudgetQuery): LenientStreakBudget[] {
  return query.apply(store.list());
}
