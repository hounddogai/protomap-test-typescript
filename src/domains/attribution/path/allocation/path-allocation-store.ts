import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PathAllocation } from "./path-allocation.js";

/** Keeps path allocations by code. */
export interface PathAllocationStore {
  find(code: string): PathAllocation | undefined;
  save(item: PathAllocation): void;
  remove(code: string): boolean;
  list(): PathAllocation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPathAllocationStore implements PathAllocationStore {
  items: Map<string, PathAllocation>;
  order: string[];

  constructor(items: Map<string, PathAllocation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PathAllocation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PathAllocation): void {
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

  list(): PathAllocation[] {
    const out: PathAllocation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPathAllocationStore(): PathAllocationStore {
  return new MemoryPathAllocationStore(new Map<string, PathAllocation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPathAllocationStore implements PathAllocationStore {
  inner: PathAllocationStore;
  cache: cache.TtlCache<PathAllocation>;
  hits: number;
  misses: number;

  constructor(
    inner: PathAllocationStore,
    cacheValue: cache.TtlCache<PathAllocation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PathAllocation | undefined {
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

  save(item: PathAllocation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PathAllocation[] {
    return this.inner.list();
  }
}

export function newCachedPathAllocationStore(inner: PathAllocationStore, ttl: number, clockValue: clock.Clock): PathAllocationStore {
  return new CachedPathAllocationStore(inner, cache.newTtlCache<PathAllocation>(512, ttl, clockValue), 0, 0);
}

/** Selects path allocations. Empty fields match all. */
export class PathAllocationQuery {
  locale: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minGraceDays: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PathAllocation): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PathAllocation[]): PathAllocation[] {
    const matched = collections.filter(items, (candidate: PathAllocation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPathAllocations(store: PathAllocationStore, query: PathAllocationQuery): PathAllocation[] {
  return query.apply(store.list());
}
