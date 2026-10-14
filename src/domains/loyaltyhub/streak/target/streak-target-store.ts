import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StreakTarget } from "./streak-target.js";

/** Keeps streak targets by code. */
export interface StreakTargetStore {
  find(code: string): StreakTarget | undefined;
  save(item: StreakTarget): void;
  remove(code: string): boolean;
  list(): StreakTarget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStreakTargetStore implements StreakTargetStore {
  items: Map<string, StreakTarget>;
  order: string[];

  constructor(items: Map<string, StreakTarget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StreakTarget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StreakTarget): void {
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

  list(): StreakTarget[] {
    const out: StreakTarget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStreakTargetStore(): StreakTargetStore {
  return new MemoryStreakTargetStore(new Map<string, StreakTarget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStreakTargetStore implements StreakTargetStore {
  inner: StreakTargetStore;
  cache: cache.TtlCache<StreakTarget>;
  hits: number;
  misses: number;

  constructor(inner: StreakTargetStore, cacheValue: cache.TtlCache<StreakTarget>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StreakTarget | undefined {
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

  save(item: StreakTarget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StreakTarget[] {
    return this.inner.list();
  }
}

export function newCachedStreakTargetStore(inner: StreakTargetStore, ttl: number, clockValue: clock.Clock): StreakTargetStore {
  return new CachedStreakTargetStore(inner, cache.newTtlCache<StreakTarget>(512, ttl, clockValue), 0, 0);
}

/** Selects streak targets. Empty fields match all. */
export class StreakTargetQuery {
  label: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minCost: number, statuses: string[], limit: number) {
    this.label = label;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StreakTarget): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StreakTarget[]): StreakTarget[] {
    const matched = collections.filter(items, (candidate: StreakTarget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStreakTargets(store: StreakTargetStore, query: StreakTargetQuery): StreakTarget[] {
  return query.apply(store.list());
}
