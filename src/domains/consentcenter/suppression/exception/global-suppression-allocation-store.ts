import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalSuppressionAllocation } from "./global-suppression-allocation.js";

/** Keeps global suppression allocations by code. */
export interface GlobalSuppressionAllocationStore {
  find(code: string): GlobalSuppressionAllocation | undefined;
  save(item: GlobalSuppressionAllocation): void;
  remove(code: string): boolean;
  list(): GlobalSuppressionAllocation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalSuppressionAllocationStore implements GlobalSuppressionAllocationStore {
  items: Map<string, GlobalSuppressionAllocation>;
  order: string[];

  constructor(items: Map<string, GlobalSuppressionAllocation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalSuppressionAllocation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalSuppressionAllocation): void {
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

  list(): GlobalSuppressionAllocation[] {
    const out: GlobalSuppressionAllocation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalSuppressionAllocationStore(): GlobalSuppressionAllocationStore {
  return new MemoryGlobalSuppressionAllocationStore(new Map<string, GlobalSuppressionAllocation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalSuppressionAllocationStore implements GlobalSuppressionAllocationStore {
  inner: GlobalSuppressionAllocationStore;
  cache: cache.TtlCache<GlobalSuppressionAllocation>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalSuppressionAllocationStore,
    cacheValue: cache.TtlCache<GlobalSuppressionAllocation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalSuppressionAllocation | undefined {
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

  save(item: GlobalSuppressionAllocation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalSuppressionAllocation[] {
    return this.inner.list();
  }
}

export function newCachedGlobalSuppressionAllocationStore(inner: GlobalSuppressionAllocationStore, ttl: number, clockValue: clock.Clock): GlobalSuppressionAllocationStore {
  return new CachedGlobalSuppressionAllocationStore(
    inner,
    cache.newTtlCache<GlobalSuppressionAllocation>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects global suppression allocations. Empty fields match all. */
export class GlobalSuppressionAllocationQuery {
  category: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minWindowDays: number, statuses: string[], limit: number) {
    this.category = category;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalSuppressionAllocation): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalSuppressionAllocation[]): GlobalSuppressionAllocation[] {
    const matched = collections.filter(items, (candidate: GlobalSuppressionAllocation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalSuppressionAllocations(store: GlobalSuppressionAllocationStore, query: GlobalSuppressionAllocationQuery): GlobalSuppressionAllocation[] {
  return query.apply(store.list());
}
