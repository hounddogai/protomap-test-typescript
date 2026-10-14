import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackStreakTarget } from "./fallback-streak-target.js";

/** Keeps fallback streak targets by code. */
export interface FallbackStreakTargetStore {
  find(code: string): FallbackStreakTarget | undefined;
  save(item: FallbackStreakTarget): void;
  remove(code: string): boolean;
  list(): FallbackStreakTarget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackStreakTargetStore implements FallbackStreakTargetStore {
  items: Map<string, FallbackStreakTarget>;
  order: string[];

  constructor(items: Map<string, FallbackStreakTarget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackStreakTarget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackStreakTarget): void {
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

  list(): FallbackStreakTarget[] {
    const out: FallbackStreakTarget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackStreakTargetStore(): FallbackStreakTargetStore {
  return new MemoryFallbackStreakTargetStore(new Map<string, FallbackStreakTarget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackStreakTargetStore implements FallbackStreakTargetStore {
  inner: FallbackStreakTargetStore;
  cache: cache.TtlCache<FallbackStreakTarget>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackStreakTargetStore,
    cacheValue: cache.TtlCache<FallbackStreakTarget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackStreakTarget | undefined {
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

  save(item: FallbackStreakTarget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackStreakTarget[] {
    return this.inner.list();
  }
}

export function newCachedFallbackStreakTargetStore(inner: FallbackStreakTargetStore, ttl: number, clockValue: clock.Clock): FallbackStreakTargetStore {
  return new CachedFallbackStreakTargetStore(inner, cache.newTtlCache<FallbackStreakTarget>(64, ttl, clockValue), 0, 0);
}

/** Selects fallback streak targets. Empty fields match all. */
export class FallbackStreakTargetQuery {
  name: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minCeiling: number, statuses: string[], limit: number) {
    this.name = name;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackStreakTarget): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackStreakTarget[]): FallbackStreakTarget[] {
    const matched = collections.filter(items, (candidate: FallbackStreakTarget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackStreakTargets(store: FallbackStreakTargetStore, query: FallbackStreakTargetQuery): FallbackStreakTarget[] {
  return query.apply(store.list());
}
