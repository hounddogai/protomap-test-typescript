import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DoubleOptInVariance } from "./double-opt-in-variance.js";

/** Keeps double opt in variances by code. */
export interface DoubleOptInVarianceStore {
  find(code: string): DoubleOptInVariance | undefined;
  save(item: DoubleOptInVariance): void;
  remove(code: string): boolean;
  list(): DoubleOptInVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDoubleOptInVarianceStore implements DoubleOptInVarianceStore {
  items: Map<string, DoubleOptInVariance>;
  order: string[];

  constructor(items: Map<string, DoubleOptInVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DoubleOptInVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DoubleOptInVariance): void {
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

  list(): DoubleOptInVariance[] {
    const out: DoubleOptInVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDoubleOptInVarianceStore(): DoubleOptInVarianceStore {
  return new MemoryDoubleOptInVarianceStore(new Map<string, DoubleOptInVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDoubleOptInVarianceStore implements DoubleOptInVarianceStore {
  inner: DoubleOptInVarianceStore;
  cache: cache.TtlCache<DoubleOptInVariance>;
  hits: number;
  misses: number;

  constructor(
    inner: DoubleOptInVarianceStore,
    cacheValue: cache.TtlCache<DoubleOptInVariance>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DoubleOptInVariance | undefined {
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

  save(item: DoubleOptInVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DoubleOptInVariance[] {
    return this.inner.list();
  }
}

export function newCachedDoubleOptInVarianceStore(inner: DoubleOptInVarianceStore, ttl: number, clockValue: clock.Clock): DoubleOptInVarianceStore {
  return new CachedDoubleOptInVarianceStore(inner, cache.newTtlCache<DoubleOptInVariance>(64, ttl, clockValue), 0, 0);
}

/** Selects double opt in variances. Empty fields match all. */
export class DoubleOptInVarianceQuery {
  category: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minLimit: number, statuses: string[], limit: number) {
    this.category = category;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DoubleOptInVariance): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DoubleOptInVariance[]): DoubleOptInVariance[] {
    const matched = collections.filter(items, (candidate: DoubleOptInVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDoubleOptInVariances(store: DoubleOptInVarianceStore, query: DoubleOptInVarianceQuery): DoubleOptInVariance[] {
  return query.apply(store.list());
}
