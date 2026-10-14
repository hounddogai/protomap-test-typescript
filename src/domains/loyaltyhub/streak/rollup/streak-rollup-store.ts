import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StreakRollup } from "./streak-rollup.js";

/** Keeps streak rollups by code. */
export interface StreakRollupStore {
  find(code: string): StreakRollup | undefined;
  save(item: StreakRollup): void;
  remove(code: string): boolean;
  list(): StreakRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStreakRollupStore implements StreakRollupStore {
  items: Map<string, StreakRollup>;
  order: string[];

  constructor(items: Map<string, StreakRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StreakRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StreakRollup): void {
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

  list(): StreakRollup[] {
    const out: StreakRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStreakRollupStore(): StreakRollupStore {
  return new MemoryStreakRollupStore(new Map<string, StreakRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStreakRollupStore implements StreakRollupStore {
  inner: StreakRollupStore;
  cache: cache.TtlCache<StreakRollup>;
  hits: number;
  misses: number;

  constructor(inner: StreakRollupStore, cacheValue: cache.TtlCache<StreakRollup>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StreakRollup | undefined {
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

  save(item: StreakRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StreakRollup[] {
    return this.inner.list();
  }
}

export function newCachedStreakRollupStore(inner: StreakRollupStore, ttl: number, clockValue: clock.Clock): StreakRollupStore {
  return new CachedStreakRollupStore(inner, cache.newTtlCache<StreakRollup>(1024, ttl, clockValue), 0, 0);
}

/** Selects streak rollups. Empty fields match all. */
export class StreakRollupQuery {
  name: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minAttempts: number, statuses: string[], limit: number) {
    this.name = name;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StreakRollup): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StreakRollup[]): StreakRollup[] {
    const matched = collections.filter(items, (candidate: StreakRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStreakRollups(store: StreakRollupStore, query: StreakRollupQuery): StreakRollup[] {
  return query.apply(store.list());
}
