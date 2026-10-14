import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PathRollup } from "./path-rollup.js";

/** Keeps path rollups by code. */
export interface PathRollupStore {
  find(code: string): PathRollup | undefined;
  save(item: PathRollup): void;
  remove(code: string): boolean;
  list(): PathRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPathRollupStore implements PathRollupStore {
  items: Map<string, PathRollup>;
  order: string[];

  constructor(items: Map<string, PathRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PathRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PathRollup): void {
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

  list(): PathRollup[] {
    const out: PathRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPathRollupStore(): PathRollupStore {
  return new MemoryPathRollupStore(new Map<string, PathRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPathRollupStore implements PathRollupStore {
  inner: PathRollupStore;
  cache: cache.TtlCache<PathRollup>;
  hits: number;
  misses: number;

  constructor(inner: PathRollupStore, cacheValue: cache.TtlCache<PathRollup>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PathRollup | undefined {
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

  save(item: PathRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PathRollup[] {
    return this.inner.list();
  }
}

export function newCachedPathRollupStore(inner: PathRollupStore, ttl: number, clockValue: clock.Clock): PathRollupStore {
  return new CachedPathRollupStore(inner, cache.newTtlCache<PathRollup>(256, ttl, clockValue), 0, 0);
}

/** Selects path rollups. Empty fields match all. */
export class PathRollupQuery {
  utmSource: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minCapacity: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PathRollup): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PathRollup[]): PathRollup[] {
    const matched = collections.filter(items, (candidate: PathRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPathRollups(store: PathRollupStore, query: PathRollupQuery): PathRollup[] {
  return query.apply(store.list());
}
