import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FlightBudget } from "./flight-budget.js";

/** Keeps flight budgets by code. */
export interface FlightBudgetStore {
  find(code: string): FlightBudget | undefined;
  save(item: FlightBudget): void;
  remove(code: string): boolean;
  list(): FlightBudget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFlightBudgetStore implements FlightBudgetStore {
  items: Map<string, FlightBudget>;
  order: string[];

  constructor(items: Map<string, FlightBudget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FlightBudget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FlightBudget): void {
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

  list(): FlightBudget[] {
    const out: FlightBudget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFlightBudgetStore(): FlightBudgetStore {
  return new MemoryFlightBudgetStore(new Map<string, FlightBudget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFlightBudgetStore implements FlightBudgetStore {
  inner: FlightBudgetStore;
  cache: cache.TtlCache<FlightBudget>;
  hits: number;
  misses: number;

  constructor(inner: FlightBudgetStore, cacheValue: cache.TtlCache<FlightBudget>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FlightBudget | undefined {
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

  save(item: FlightBudget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FlightBudget[] {
    return this.inner.list();
  }
}

export function newCachedFlightBudgetStore(inner: FlightBudgetStore, ttl: number, clockValue: clock.Clock): FlightBudgetStore {
  return new CachedFlightBudgetStore(inner, cache.newTtlCache<FlightBudget>(1024, ttl, clockValue), 0, 0);
}

/** Selects flight budgets. Empty fields match all. */
export class FlightBudgetQuery {
  unit: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minScore: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FlightBudget): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FlightBudget[]): FlightBudget[] {
    const matched = collections.filter(items, (candidate: FlightBudget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFlightBudgets(store: FlightBudgetStore, query: FlightBudgetQuery): FlightBudget[] {
  return query.apply(store.list());
}
