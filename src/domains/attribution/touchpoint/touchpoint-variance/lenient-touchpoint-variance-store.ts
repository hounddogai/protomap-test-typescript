import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientTouchpointVariance } from "./lenient-touchpoint-variance.js";

/** Keeps lenient touchpoint variances by code. */
export interface LenientTouchpointVarianceStore {
  find(code: string): LenientTouchpointVariance | undefined;
  save(item: LenientTouchpointVariance): void;
  remove(code: string): boolean;
  list(): LenientTouchpointVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientTouchpointVarianceStore implements LenientTouchpointVarianceStore {
  items: Map<string, LenientTouchpointVariance>;
  order: string[];

  constructor(items: Map<string, LenientTouchpointVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientTouchpointVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientTouchpointVariance): void {
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

  list(): LenientTouchpointVariance[] {
    const out: LenientTouchpointVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientTouchpointVarianceStore(): LenientTouchpointVarianceStore {
  return new MemoryLenientTouchpointVarianceStore(new Map<string, LenientTouchpointVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientTouchpointVarianceStore implements LenientTouchpointVarianceStore {
  inner: LenientTouchpointVarianceStore;
  cache: cache.TtlCache<LenientTouchpointVariance>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientTouchpointVarianceStore,
    cacheValue: cache.TtlCache<LenientTouchpointVariance>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientTouchpointVariance | undefined {
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

  save(item: LenientTouchpointVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientTouchpointVariance[] {
    return this.inner.list();
  }
}

export function newCachedLenientTouchpointVarianceStore(inner: LenientTouchpointVarianceStore, ttl: number, clockValue: clock.Clock): LenientTouchpointVarianceStore {
  return new CachedLenientTouchpointVarianceStore(
    inner,
    cache.newTtlCache<LenientTouchpointVariance>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient touchpoint variances. Empty fields match all. */
export class LenientTouchpointVarianceQuery {
  name: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientTouchpointVariance): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientTouchpointVariance[]): LenientTouchpointVariance[] {
    const matched = collections.filter(items, (candidate: LenientTouchpointVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientTouchpointVariances(store: LenientTouchpointVarianceStore, query: LenientTouchpointVarianceQuery): LenientTouchpointVariance[] {
  return query.apply(store.list());
}
