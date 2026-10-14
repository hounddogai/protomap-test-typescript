import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedExitRuleCycle } from "./weighted-exit-rule-cycle.js";

/** Keeps weighted exit rule cycles by code. */
export interface WeightedExitRuleCycleStore {
  find(code: string): WeightedExitRuleCycle | undefined;
  save(item: WeightedExitRuleCycle): void;
  remove(code: string): boolean;
  list(): WeightedExitRuleCycle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedExitRuleCycleStore implements WeightedExitRuleCycleStore {
  items: Map<string, WeightedExitRuleCycle>;
  order: string[];

  constructor(items: Map<string, WeightedExitRuleCycle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedExitRuleCycle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedExitRuleCycle): void {
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

  list(): WeightedExitRuleCycle[] {
    const out: WeightedExitRuleCycle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedExitRuleCycleStore(): WeightedExitRuleCycleStore {
  return new MemoryWeightedExitRuleCycleStore(new Map<string, WeightedExitRuleCycle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedExitRuleCycleStore implements WeightedExitRuleCycleStore {
  inner: WeightedExitRuleCycleStore;
  cache: cache.TtlCache<WeightedExitRuleCycle>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedExitRuleCycleStore,
    cacheValue: cache.TtlCache<WeightedExitRuleCycle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedExitRuleCycle | undefined {
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

  save(item: WeightedExitRuleCycle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedExitRuleCycle[] {
    return this.inner.list();
  }
}

export function newCachedWeightedExitRuleCycleStore(inner: WeightedExitRuleCycleStore, ttl: number, clockValue: clock.Clock): WeightedExitRuleCycleStore {
  return new CachedWeightedExitRuleCycleStore(
    inner,
    cache.newTtlCache<WeightedExitRuleCycle>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted exit rule cycles. Empty fields match all. */
export class WeightedExitRuleCycleQuery {
  title: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minBudget: number, statuses: string[], limit: number) {
    this.title = title;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedExitRuleCycle): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedExitRuleCycle[]): WeightedExitRuleCycle[] {
    const matched = collections.filter(items, (candidate: WeightedExitRuleCycle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedExitRuleCycles(store: WeightedExitRuleCycleStore, query: WeightedExitRuleCycleQuery): WeightedExitRuleCycle[] {
  return query.apply(store.list());
}
