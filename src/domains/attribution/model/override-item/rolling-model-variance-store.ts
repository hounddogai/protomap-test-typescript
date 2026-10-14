import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingModelVariance } from "./rolling-model-variance.js";

/** Keeps rolling model variances by code. */
export interface RollingModelVarianceStore {
  find(code: string): RollingModelVariance | undefined;
  save(item: RollingModelVariance): void;
  remove(code: string): boolean;
  list(): RollingModelVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingModelVarianceStore implements RollingModelVarianceStore {
  items: Map<string, RollingModelVariance>;
  order: string[];

  constructor(items: Map<string, RollingModelVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingModelVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingModelVariance): void {
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

  list(): RollingModelVariance[] {
    const out: RollingModelVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingModelVarianceStore(): RollingModelVarianceStore {
  return new MemoryRollingModelVarianceStore(new Map<string, RollingModelVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingModelVarianceStore implements RollingModelVarianceStore {
  inner: RollingModelVarianceStore;
  cache: cache.TtlCache<RollingModelVariance>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingModelVarianceStore,
    cacheValue: cache.TtlCache<RollingModelVariance>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingModelVariance | undefined {
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

  save(item: RollingModelVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingModelVariance[] {
    return this.inner.list();
  }
}

export function newCachedRollingModelVarianceStore(inner: RollingModelVarianceStore, ttl: number, clockValue: clock.Clock): RollingModelVarianceStore {
  return new CachedRollingModelVarianceStore(
    inner,
    cache.newTtlCache<RollingModelVariance>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling model variances. Empty fields match all. */
export class RollingModelVarianceQuery {
  category: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minRatio: number, statuses: string[], limit: number) {
    this.category = category;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingModelVariance): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingModelVariance[]): RollingModelVariance[] {
    const matched = collections.filter(items, (candidate: RollingModelVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingModelVariances(store: RollingModelVarianceStore, query: RollingModelVarianceQuery): RollingModelVariance[] {
  return query.apply(store.list());
}
