import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyPacingBudget } from "./legacy-pacing-budget.js";

/** Keeps legacy pacing budgets by code. */
export interface LegacyPacingBudgetStore {
  find(code: string): LegacyPacingBudget | undefined;
  save(item: LegacyPacingBudget): void;
  remove(code: string): boolean;
  list(): LegacyPacingBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyPacingBudgetStore implements LegacyPacingBudgetStore {
  items: Map<string, LegacyPacingBudget>;
  order: string[];

  constructor(items: Map<string, LegacyPacingBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyPacingBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyPacingBudget): void {
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

  list(): LegacyPacingBudget[] {
    const out: LegacyPacingBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyPacingBudgetStore(): LegacyPacingBudgetStore {
  return new MemoryLegacyPacingBudgetStore(new Map<string, LegacyPacingBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyPacingBudgetStore implements LegacyPacingBudgetStore {
  inner: LegacyPacingBudgetStore;
  cache: cache.TtlCache<LegacyPacingBudget>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyPacingBudgetStore,
    cacheValue: cache.TtlCache<LegacyPacingBudget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyPacingBudget | undefined {
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

  save(item: LegacyPacingBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyPacingBudget[] {
    return this.inner.list();
  }
}

export function newCachedLegacyPacingBudgetStore(inner: LegacyPacingBudgetStore, ttl: number, clockValue: clock.Clock): LegacyPacingBudgetStore {
  return new CachedLegacyPacingBudgetStore(inner, cache.newTtlCache<LegacyPacingBudget>(1024, ttl, clockValue), 0, 0);
}

/** Selects legacy pacing budgets. Empty fields match all. */
export class LegacyPacingBudgetQuery {
  name: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minCeiling: number, statuses: string[], limit: number) {
    this.name = name;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyPacingBudget): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyPacingBudget[]): LegacyPacingBudget[] {
    const matched = collections.filter(items, (candidate: LegacyPacingBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyPacingBudgets(store: LegacyPacingBudgetStore, query: LegacyPacingBudgetQuery): LegacyPacingBudget[] {
  return query.apply(store.list());
}
