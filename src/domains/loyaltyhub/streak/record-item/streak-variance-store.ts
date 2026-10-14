import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StreakVariance } from "./streak-variance.js";

/** Keeps streak variances by code. */
export interface StreakVarianceStore {
  find(code: string): StreakVariance | undefined;
  save(item: StreakVariance): void;
  remove(code: string): boolean;
  list(): StreakVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStreakVarianceStore implements StreakVarianceStore {
  items: Map<string, StreakVariance>;
  order: string[];

  constructor(items: Map<string, StreakVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StreakVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StreakVariance): void {
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

  list(): StreakVariance[] {
    const out: StreakVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStreakVarianceStore(): StreakVarianceStore {
  return new MemoryStreakVarianceStore(new Map<string, StreakVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStreakVarianceStore implements StreakVarianceStore {
  inner: StreakVarianceStore;
  cache: cache.TtlCache<StreakVariance>;
  hits: number;
  misses: number;

  constructor(
    inner: StreakVarianceStore,
    cacheValue: cache.TtlCache<StreakVariance>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StreakVariance | undefined {
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

  save(item: StreakVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StreakVariance[] {
    return this.inner.list();
  }
}

export function newCachedStreakVarianceStore(inner: StreakVarianceStore, ttl: number, clockValue: clock.Clock): StreakVarianceStore {
  return new CachedStreakVarianceStore(inner, cache.newTtlCache<StreakVariance>(512, ttl, clockValue), 0, 0);
}

/** Selects streak variances. Empty fields match all. */
export class StreakVarianceQuery {
  source: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.source = source;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StreakVariance): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StreakVariance[]): StreakVariance[] {
    const matched = collections.filter(items, (candidate: StreakVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStreakVariances(store: StreakVarianceStore, query: StreakVarianceQuery): StreakVariance[] {
  return query.apply(store.list());
}
