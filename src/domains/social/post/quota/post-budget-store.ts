import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PostBudget } from "./post-budget.js";

/** Keeps post budgets by code. */
export interface PostBudgetStore {
  find(code: string): PostBudget | undefined;
  save(item: PostBudget): void;
  remove(code: string): boolean;
  list(): PostBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPostBudgetStore implements PostBudgetStore {
  items: Map<string, PostBudget>;
  order: string[];

  constructor(items: Map<string, PostBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PostBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PostBudget): void {
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

  list(): PostBudget[] {
    const out: PostBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPostBudgetStore(): PostBudgetStore {
  return new MemoryPostBudgetStore(new Map<string, PostBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPostBudgetStore implements PostBudgetStore {
  inner: PostBudgetStore;
  cache: cache.TtlCache<PostBudget>;
  hits: number;
  misses: number;

  constructor(inner: PostBudgetStore, cacheValue: cache.TtlCache<PostBudget>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PostBudget | undefined {
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

  save(item: PostBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PostBudget[] {
    return this.inner.list();
  }
}

export function newCachedPostBudgetStore(inner: PostBudgetStore, ttl: number, clockValue: clock.Clock): PostBudgetStore {
  return new CachedPostBudgetStore(inner, cache.newTtlCache<PostBudget>(256, ttl, clockValue), 0, 0);
}

/** Selects post budgets. Empty fields match all. */
export class PostBudgetQuery {
  category: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minStartsAt: number, statuses: string[], limit: number) {
    this.category = category;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PostBudget): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PostBudget[]): PostBudget[] {
    const matched = collections.filter(items, (candidate: PostBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPostBudgets(store: PostBudgetStore, query: PostBudgetQuery): PostBudget[] {
  return query.apply(store.list());
}
