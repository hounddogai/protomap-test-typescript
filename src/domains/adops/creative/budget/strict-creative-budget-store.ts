import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictCreativeBudget } from "./strict-creative-budget.js";

/** Keeps strict creative budgets by code. */
export interface StrictCreativeBudgetStore {
  find(code: string): StrictCreativeBudget | undefined;
  save(item: StrictCreativeBudget): void;
  remove(code: string): boolean;
  list(): StrictCreativeBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictCreativeBudgetStore implements StrictCreativeBudgetStore {
  items: Map<string, StrictCreativeBudget>;
  order: string[];

  constructor(items: Map<string, StrictCreativeBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictCreativeBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictCreativeBudget): void {
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

  list(): StrictCreativeBudget[] {
    const out: StrictCreativeBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictCreativeBudgetStore(): StrictCreativeBudgetStore {
  return new MemoryStrictCreativeBudgetStore(new Map<string, StrictCreativeBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictCreativeBudgetStore implements StrictCreativeBudgetStore {
  inner: StrictCreativeBudgetStore;
  cache: cache.TtlCache<StrictCreativeBudget>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictCreativeBudgetStore,
    cacheValue: cache.TtlCache<StrictCreativeBudget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictCreativeBudget | undefined {
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

  save(item: StrictCreativeBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictCreativeBudget[] {
    return this.inner.list();
  }
}

export function newCachedStrictCreativeBudgetStore(inner: StrictCreativeBudgetStore, ttl: number, clockValue: clock.Clock): StrictCreativeBudgetStore {
  return new CachedStrictCreativeBudgetStore(
    inner,
    cache.newTtlCache<StrictCreativeBudget>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects strict creative budgets. Empty fields match all. */
export class StrictCreativeBudgetQuery {
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

  matches(item: StrictCreativeBudget): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictCreativeBudget[]): StrictCreativeBudget[] {
    const matched = collections.filter(items, (candidate: StrictCreativeBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictCreativeBudgets(store: StrictCreativeBudgetStore, query: StrictCreativeBudgetQuery): StrictCreativeBudget[] {
  return query.apply(store.list());
}
