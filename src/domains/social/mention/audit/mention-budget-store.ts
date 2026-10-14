import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { MentionBudget } from "./mention-budget.js";

/** Keeps mention budgets by code. */
export interface MentionBudgetStore {
  find(code: string): MentionBudget | undefined;
  save(item: MentionBudget): void;
  remove(code: string): boolean;
  list(): MentionBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryMentionBudgetStore implements MentionBudgetStore {
  items: Map<string, MentionBudget>;
  order: string[];

  constructor(items: Map<string, MentionBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): MentionBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: MentionBudget): void {
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

  list(): MentionBudget[] {
    const out: MentionBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryMentionBudgetStore(): MentionBudgetStore {
  return new MemoryMentionBudgetStore(new Map<string, MentionBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedMentionBudgetStore implements MentionBudgetStore {
  inner: MentionBudgetStore;
  cache: cache.TtlCache<MentionBudget>;
  hits: number;
  misses: number;

  constructor(inner: MentionBudgetStore, cacheValue: cache.TtlCache<MentionBudget>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): MentionBudget | undefined {
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

  save(item: MentionBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): MentionBudget[] {
    return this.inner.list();
  }
}

export function newCachedMentionBudgetStore(inner: MentionBudgetStore, ttl: number, clockValue: clock.Clock): MentionBudgetStore {
  return new CachedMentionBudgetStore(inner, cache.newTtlCache<MentionBudget>(64, ttl, clockValue), 0, 0);
}

/** Selects mention budgets. Empty fields match all. */
export class MentionBudgetQuery {
  locale: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minQuantity: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: MentionBudget): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: MentionBudget[]): MentionBudget[] {
    const matched = collections.filter(items, (candidate: MentionBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findMentionBudgets(store: MentionBudgetStore, query: MentionBudgetQuery): MentionBudget[] {
  return query.apply(store.list());
}
