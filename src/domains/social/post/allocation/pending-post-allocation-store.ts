import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingPostAllocation } from "./pending-post-allocation.js";

/** Keeps pending post allocations by code. */
export interface PendingPostAllocationStore {
  find(code: string): PendingPostAllocation | undefined;
  save(item: PendingPostAllocation): void;
  remove(code: string): boolean;
  list(): PendingPostAllocation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingPostAllocationStore implements PendingPostAllocationStore {
  items: Map<string, PendingPostAllocation>;
  order: string[];

  constructor(items: Map<string, PendingPostAllocation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingPostAllocation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingPostAllocation): void {
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

  list(): PendingPostAllocation[] {
    const out: PendingPostAllocation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingPostAllocationStore(): PendingPostAllocationStore {
  return new MemoryPendingPostAllocationStore(new Map<string, PendingPostAllocation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingPostAllocationStore implements PendingPostAllocationStore {
  inner: PendingPostAllocationStore;
  cache: cache.TtlCache<PendingPostAllocation>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingPostAllocationStore,
    cacheValue: cache.TtlCache<PendingPostAllocation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingPostAllocation | undefined {
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

  save(item: PendingPostAllocation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingPostAllocation[] {
    return this.inner.list();
  }
}

export function newCachedPendingPostAllocationStore(inner: PendingPostAllocationStore, ttl: number, clockValue: clock.Clock): PendingPostAllocationStore {
  return new CachedPendingPostAllocationStore(
    inner,
    cache.newTtlCache<PendingPostAllocation>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending post allocations. Empty fields match all. */
export class PendingPostAllocationQuery {
  name: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minThreshold: number, statuses: string[], limit: number) {
    this.name = name;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingPostAllocation): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingPostAllocation[]): PendingPostAllocation[] {
    const matched = collections.filter(items, (candidate: PendingPostAllocation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingPostAllocations(store: PendingPostAllocationStore, query: PendingPostAllocationQuery): PendingPostAllocation[] {
  return query.apply(store.list());
}
