import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultRewardRuleBudget } from "./default-reward-rule-budget.js";

/** Keeps default reward rule budgets by code. */
export interface DefaultRewardRuleBudgetStore {
  find(code: string): DefaultRewardRuleBudget | undefined;
  save(item: DefaultRewardRuleBudget): void;
  remove(code: string): boolean;
  list(): DefaultRewardRuleBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultRewardRuleBudgetStore implements DefaultRewardRuleBudgetStore {
  items: Map<string, DefaultRewardRuleBudget>;
  order: string[];

  constructor(items: Map<string, DefaultRewardRuleBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultRewardRuleBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultRewardRuleBudget): void {
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

  list(): DefaultRewardRuleBudget[] {
    const out: DefaultRewardRuleBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultRewardRuleBudgetStore(): DefaultRewardRuleBudgetStore {
  return new MemoryDefaultRewardRuleBudgetStore(new Map<string, DefaultRewardRuleBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultRewardRuleBudgetStore implements DefaultRewardRuleBudgetStore {
  inner: DefaultRewardRuleBudgetStore;
  cache: cache.TtlCache<DefaultRewardRuleBudget>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultRewardRuleBudgetStore,
    cacheValue: cache.TtlCache<DefaultRewardRuleBudget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultRewardRuleBudget | undefined {
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

  save(item: DefaultRewardRuleBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultRewardRuleBudget[] {
    return this.inner.list();
  }
}

export function newCachedDefaultRewardRuleBudgetStore(inner: DefaultRewardRuleBudgetStore, ttl: number, clockValue: clock.Clock): DefaultRewardRuleBudgetStore {
  return new CachedDefaultRewardRuleBudgetStore(
    inner,
    cache.newTtlCache<DefaultRewardRuleBudget>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default reward rule budgets. Empty fields match all. */
export class DefaultRewardRuleBudgetQuery {
  title: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.title = title;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultRewardRuleBudget): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultRewardRuleBudget[]): DefaultRewardRuleBudget[] {
    const matched = collections.filter(items, (candidate: DefaultRewardRuleBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultRewardRuleBudgets(store: DefaultRewardRuleBudgetStore, query: DefaultRewardRuleBudgetQuery): DefaultRewardRuleBudget[] {
  return query.apply(store.list());
}
