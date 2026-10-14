import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DeflectionAllocation } from "./deflection-allocation.js";

/** Keeps deflection allocations by code. */
export interface DeflectionAllocationStore {
  find(code: string): DeflectionAllocation | undefined;
  save(item: DeflectionAllocation): void;
  remove(code: string): boolean;
  list(): DeflectionAllocation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDeflectionAllocationStore implements DeflectionAllocationStore {
  items: Map<string, DeflectionAllocation>;
  order: string[];

  constructor(items: Map<string, DeflectionAllocation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DeflectionAllocation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DeflectionAllocation): void {
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

  list(): DeflectionAllocation[] {
    const out: DeflectionAllocation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDeflectionAllocationStore(): DeflectionAllocationStore {
  return new MemoryDeflectionAllocationStore(new Map<string, DeflectionAllocation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDeflectionAllocationStore implements DeflectionAllocationStore {
  inner: DeflectionAllocationStore;
  cache: cache.TtlCache<DeflectionAllocation>;
  hits: number;
  misses: number;

  constructor(
    inner: DeflectionAllocationStore,
    cacheValue: cache.TtlCache<DeflectionAllocation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DeflectionAllocation | undefined {
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

  save(item: DeflectionAllocation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DeflectionAllocation[] {
    return this.inner.list();
  }
}

export function newCachedDeflectionAllocationStore(inner: DeflectionAllocationStore, ttl: number, clockValue: clock.Clock): DeflectionAllocationStore {
  return new CachedDeflectionAllocationStore(inner, cache.newTtlCache<DeflectionAllocation>(64, ttl, clockValue), 0, 0);
}

/** Selects deflection allocations. Empty fields match all. */
export class DeflectionAllocationQuery {
  locale: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minMargin: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DeflectionAllocation): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DeflectionAllocation[]): DeflectionAllocation[] {
    const matched = collections.filter(items, (candidate: DeflectionAllocation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDeflectionAllocations(store: DeflectionAllocationStore, query: DeflectionAllocationQuery): DeflectionAllocation[] {
  return query.apply(store.list());
}
