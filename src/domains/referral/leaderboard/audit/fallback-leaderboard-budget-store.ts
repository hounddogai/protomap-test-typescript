import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackLeaderboardBudget } from "./fallback-leaderboard-budget.js";

/** Keeps fallback leaderboard budgets by code. */
export interface FallbackLeaderboardBudgetStore {
  find(code: string): FallbackLeaderboardBudget | undefined;
  save(item: FallbackLeaderboardBudget): void;
  remove(code: string): boolean;
  list(): FallbackLeaderboardBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackLeaderboardBudgetStore implements FallbackLeaderboardBudgetStore {
  items: Map<string, FallbackLeaderboardBudget>;
  order: string[];

  constructor(items: Map<string, FallbackLeaderboardBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackLeaderboardBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackLeaderboardBudget): void {
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

  list(): FallbackLeaderboardBudget[] {
    const out: FallbackLeaderboardBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackLeaderboardBudgetStore(): FallbackLeaderboardBudgetStore {
  return new MemoryFallbackLeaderboardBudgetStore(new Map<string, FallbackLeaderboardBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackLeaderboardBudgetStore implements FallbackLeaderboardBudgetStore {
  inner: FallbackLeaderboardBudgetStore;
  cache: cache.TtlCache<FallbackLeaderboardBudget>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackLeaderboardBudgetStore,
    cacheValue: cache.TtlCache<FallbackLeaderboardBudget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackLeaderboardBudget | undefined {
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

  save(item: FallbackLeaderboardBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackLeaderboardBudget[] {
    return this.inner.list();
  }
}

export function newCachedFallbackLeaderboardBudgetStore(inner: FallbackLeaderboardBudgetStore, ttl: number, clockValue: clock.Clock): FallbackLeaderboardBudgetStore {
  return new CachedFallbackLeaderboardBudgetStore(
    inner,
    cache.newTtlCache<FallbackLeaderboardBudget>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback leaderboard budgets. Empty fields match all. */
export class FallbackLeaderboardBudgetQuery {
  source: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minImpressions: number, statuses: string[], limit: number) {
    this.source = source;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackLeaderboardBudget): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackLeaderboardBudget[]): FallbackLeaderboardBudget[] {
    const matched = collections.filter(items, (candidate: FallbackLeaderboardBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackLeaderboardBudgets(store: FallbackLeaderboardBudgetStore, query: FallbackLeaderboardBudgetQuery): FallbackLeaderboardBudget[] {
  return query.apply(store.list());
}
