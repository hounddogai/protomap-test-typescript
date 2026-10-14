import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalRewardBudget } from "./seasonal-reward-budget.js";

/** Keeps seasonal reward budgets by code. */
export interface SeasonalRewardBudgetStore {
  find(code: string): SeasonalRewardBudget | undefined;
  save(item: SeasonalRewardBudget): void;
  remove(code: string): boolean;
  list(): SeasonalRewardBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalRewardBudgetStore implements SeasonalRewardBudgetStore {
  items: Map<string, SeasonalRewardBudget>;
  order: string[];

  constructor(items: Map<string, SeasonalRewardBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalRewardBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalRewardBudget): void {
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

  list(): SeasonalRewardBudget[] {
    const out: SeasonalRewardBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalRewardBudgetStore(): SeasonalRewardBudgetStore {
  return new MemorySeasonalRewardBudgetStore(new Map<string, SeasonalRewardBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalRewardBudgetStore implements SeasonalRewardBudgetStore {
  inner: SeasonalRewardBudgetStore;
  cache: cache.TtlCache<SeasonalRewardBudget>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalRewardBudgetStore,
    cacheValue: cache.TtlCache<SeasonalRewardBudget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalRewardBudget | undefined {
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

  save(item: SeasonalRewardBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalRewardBudget[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalRewardBudgetStore(inner: SeasonalRewardBudgetStore, ttl: number, clockValue: clock.Clock): SeasonalRewardBudgetStore {
  return new CachedSeasonalRewardBudgetStore(
    inner,
    cache.newTtlCache<SeasonalRewardBudget>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal reward budgets. Empty fields match all. */
export class SeasonalRewardBudgetQuery {
  country: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minMinimum: number, statuses: string[], limit: number) {
    this.country = country;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalRewardBudget): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalRewardBudget[]): SeasonalRewardBudget[] {
    const matched = collections.filter(items, (candidate: SeasonalRewardBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalRewardBudgets(store: SeasonalRewardBudgetStore, query: SeasonalRewardBudgetQuery): SeasonalRewardBudget[] {
  return query.apply(store.list());
}
