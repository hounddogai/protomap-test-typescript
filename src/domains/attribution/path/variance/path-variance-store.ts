import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PathVariance } from "./path-variance.js";

/** Keeps path variances by code. */
export interface PathVarianceStore {
  find(code: string): PathVariance | undefined;
  save(item: PathVariance): void;
  remove(code: string): boolean;
  list(): PathVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPathVarianceStore implements PathVarianceStore {
  items: Map<string, PathVariance>;
  order: string[];

  constructor(items: Map<string, PathVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PathVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PathVariance): void {
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

  list(): PathVariance[] {
    const out: PathVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPathVarianceStore(): PathVarianceStore {
  return new MemoryPathVarianceStore(new Map<string, PathVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPathVarianceStore implements PathVarianceStore {
  inner: PathVarianceStore;
  cache: cache.TtlCache<PathVariance>;
  hits: number;
  misses: number;

  constructor(inner: PathVarianceStore, cacheValue: cache.TtlCache<PathVariance>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PathVariance | undefined {
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

  save(item: PathVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PathVariance[] {
    return this.inner.list();
  }
}

export function newCachedPathVarianceStore(inner: PathVarianceStore, ttl: number, clockValue: clock.Clock): PathVarianceStore {
  return new CachedPathVarianceStore(inner, cache.newTtlCache<PathVariance>(128, ttl, clockValue), 0, 0);
}

/** Selects path variances. Empty fields match all. */
export class PathVarianceQuery {
  name: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minGraceDays: number, statuses: string[], limit: number) {
    this.name = name;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PathVariance): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PathVariance[]): PathVariance[] {
    const matched = collections.filter(items, (candidate: PathVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPathVariances(store: PathVarianceStore, query: PathVarianceQuery): PathVariance[] {
  return query.apply(store.list());
}
