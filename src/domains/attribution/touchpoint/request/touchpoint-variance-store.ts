import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TouchpointVariance } from "./touchpoint-variance.js";

/** Keeps touchpoint variances by code. */
export interface TouchpointVarianceStore {
  find(code: string): TouchpointVariance | undefined;
  save(item: TouchpointVariance): void;
  remove(code: string): boolean;
  list(): TouchpointVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTouchpointVarianceStore implements TouchpointVarianceStore {
  items: Map<string, TouchpointVariance>;
  order: string[];

  constructor(items: Map<string, TouchpointVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TouchpointVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TouchpointVariance): void {
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

  list(): TouchpointVariance[] {
    const out: TouchpointVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTouchpointVarianceStore(): TouchpointVarianceStore {
  return new MemoryTouchpointVarianceStore(new Map<string, TouchpointVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTouchpointVarianceStore implements TouchpointVarianceStore {
  inner: TouchpointVarianceStore;
  cache: cache.TtlCache<TouchpointVariance>;
  hits: number;
  misses: number;

  constructor(
    inner: TouchpointVarianceStore,
    cacheValue: cache.TtlCache<TouchpointVariance>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TouchpointVariance | undefined {
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

  save(item: TouchpointVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TouchpointVariance[] {
    return this.inner.list();
  }
}

export function newCachedTouchpointVarianceStore(inner: TouchpointVarianceStore, ttl: number, clockValue: clock.Clock): TouchpointVarianceStore {
  return new CachedTouchpointVarianceStore(inner, cache.newTtlCache<TouchpointVariance>(64, ttl, clockValue), 0, 0);
}

/** Selects touchpoint variances. Empty fields match all. */
export class TouchpointVarianceQuery {
  label: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minMargin: number, statuses: string[], limit: number) {
    this.label = label;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TouchpointVariance): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TouchpointVariance[]): TouchpointVariance[] {
    const matched = collections.filter(items, (candidate: TouchpointVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTouchpointVariances(store: TouchpointVarianceStore, query: TouchpointVarianceQuery): TouchpointVariance[] {
  return query.apply(store.list());
}
