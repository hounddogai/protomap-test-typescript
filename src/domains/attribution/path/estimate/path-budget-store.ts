import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PathBudget } from "./path-budget.js";

/** Keeps path budgets by code. */
export interface PathBudgetStore {
  find(code: string): PathBudget | undefined;
  save(item: PathBudget): void;
  remove(code: string): boolean;
  list(): PathBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPathBudgetStore implements PathBudgetStore {
  items: Map<string, PathBudget>;
  order: string[];

  constructor(items: Map<string, PathBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PathBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PathBudget): void {
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

  list(): PathBudget[] {
    const out: PathBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPathBudgetStore(): PathBudgetStore {
  return new MemoryPathBudgetStore(new Map<string, PathBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPathBudgetStore implements PathBudgetStore {
  inner: PathBudgetStore;
  cache: cache.TtlCache<PathBudget>;
  hits: number;
  misses: number;

  constructor(inner: PathBudgetStore, cacheValue: cache.TtlCache<PathBudget>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PathBudget | undefined {
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

  save(item: PathBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PathBudget[] {
    return this.inner.list();
  }
}

export function newCachedPathBudgetStore(inner: PathBudgetStore, ttl: number, clockValue: clock.Clock): PathBudgetStore {
  return new CachedPathBudgetStore(inner, cache.newTtlCache<PathBudget>(64, ttl, clockValue), 0, 0);
}

/** Selects path budgets. Empty fields match all. */
export class PathBudgetQuery {
  source: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minRetries: number, statuses: string[], limit: number) {
    this.source = source;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PathBudget): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PathBudget[]): PathBudget[] {
    const matched = collections.filter(items, (candidate: PathBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPathBudgets(store: PathBudgetStore, query: PathBudgetQuery): PathBudget[] {
  return query.apply(store.list());
}
