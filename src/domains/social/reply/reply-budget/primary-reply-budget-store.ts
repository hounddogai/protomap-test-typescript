import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryReplyBudget } from "./primary-reply-budget.js";

/** Keeps primary reply budgets by code. */
export interface PrimaryReplyBudgetStore {
  find(code: string): PrimaryReplyBudget | undefined;
  save(item: PrimaryReplyBudget): void;
  remove(code: string): boolean;
  list(): PrimaryReplyBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryReplyBudgetStore implements PrimaryReplyBudgetStore {
  items: Map<string, PrimaryReplyBudget>;
  order: string[];

  constructor(items: Map<string, PrimaryReplyBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryReplyBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryReplyBudget): void {
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

  list(): PrimaryReplyBudget[] {
    const out: PrimaryReplyBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryReplyBudgetStore(): PrimaryReplyBudgetStore {
  return new MemoryPrimaryReplyBudgetStore(new Map<string, PrimaryReplyBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryReplyBudgetStore implements PrimaryReplyBudgetStore {
  inner: PrimaryReplyBudgetStore;
  cache: cache.TtlCache<PrimaryReplyBudget>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryReplyBudgetStore,
    cacheValue: cache.TtlCache<PrimaryReplyBudget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryReplyBudget | undefined {
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

  save(item: PrimaryReplyBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryReplyBudget[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryReplyBudgetStore(inner: PrimaryReplyBudgetStore, ttl: number, clockValue: clock.Clock): PrimaryReplyBudgetStore {
  return new CachedPrimaryReplyBudgetStore(inner, cache.newTtlCache<PrimaryReplyBudget>(128, ttl, clockValue), 0, 0);
}

/** Selects primary reply budgets. Empty fields match all. */
export class PrimaryReplyBudgetQuery {
  title: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minImpressions: number, statuses: string[], limit: number) {
    this.title = title;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryReplyBudget): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryReplyBudget[]): PrimaryReplyBudget[] {
    const matched = collections.filter(items, (candidate: PrimaryReplyBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryReplyBudgets(store: PrimaryReplyBudgetStore, query: PrimaryReplyBudgetQuery): PrimaryReplyBudget[] {
  return query.apply(store.list());
}
