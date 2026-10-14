import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalWarmupBudget } from "./seasonal-warmup-budget.js";

/** Keeps seasonal warmup budgets by code. */
export interface SeasonalWarmupBudgetStore {
  find(code: string): SeasonalWarmupBudget | undefined;
  save(item: SeasonalWarmupBudget): void;
  remove(code: string): boolean;
  list(): SeasonalWarmupBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalWarmupBudgetStore implements SeasonalWarmupBudgetStore {
  items: Map<string, SeasonalWarmupBudget>;
  order: string[];

  constructor(items: Map<string, SeasonalWarmupBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalWarmupBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalWarmupBudget): void {
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

  list(): SeasonalWarmupBudget[] {
    const out: SeasonalWarmupBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalWarmupBudgetStore(): SeasonalWarmupBudgetStore {
  return new MemorySeasonalWarmupBudgetStore(new Map<string, SeasonalWarmupBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalWarmupBudgetStore implements SeasonalWarmupBudgetStore {
  inner: SeasonalWarmupBudgetStore;
  cache: cache.TtlCache<SeasonalWarmupBudget>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalWarmupBudgetStore,
    cacheValue: cache.TtlCache<SeasonalWarmupBudget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalWarmupBudget | undefined {
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

  save(item: SeasonalWarmupBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalWarmupBudget[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalWarmupBudgetStore(inner: SeasonalWarmupBudgetStore, ttl: number, clockValue: clock.Clock): SeasonalWarmupBudgetStore {
  return new CachedSeasonalWarmupBudgetStore(
    inner,
    cache.newTtlCache<SeasonalWarmupBudget>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal warmup budgets. Empty fields match all. */
export class SeasonalWarmupBudgetQuery {
  name: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minMargin: number, statuses: string[], limit: number) {
    this.name = name;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalWarmupBudget): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalWarmupBudget[]): SeasonalWarmupBudget[] {
    const matched = collections.filter(items, (candidate: SeasonalWarmupBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalWarmupBudgets(store: SeasonalWarmupBudgetStore, query: SeasonalWarmupBudgetQuery): SeasonalWarmupBudget[] {
  return query.apply(store.list());
}
