import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SuppressionAllocation } from "./suppression-allocation.js";

/** Keeps suppression allocations by code. */
export interface SuppressionAllocationStore {
  find(code: string): SuppressionAllocation | undefined;
  save(item: SuppressionAllocation): void;
  remove(code: string): boolean;
  list(): SuppressionAllocation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySuppressionAllocationStore implements SuppressionAllocationStore {
  items: Map<string, SuppressionAllocation>;
  order: string[];

  constructor(items: Map<string, SuppressionAllocation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SuppressionAllocation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SuppressionAllocation): void {
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

  list(): SuppressionAllocation[] {
    const out: SuppressionAllocation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySuppressionAllocationStore(): SuppressionAllocationStore {
  return new MemorySuppressionAllocationStore(new Map<string, SuppressionAllocation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSuppressionAllocationStore implements SuppressionAllocationStore {
  inner: SuppressionAllocationStore;
  cache: cache.TtlCache<SuppressionAllocation>;
  hits: number;
  misses: number;

  constructor(
    inner: SuppressionAllocationStore,
    cacheValue: cache.TtlCache<SuppressionAllocation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SuppressionAllocation | undefined {
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

  save(item: SuppressionAllocation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SuppressionAllocation[] {
    return this.inner.list();
  }
}

export function newCachedSuppressionAllocationStore(inner: SuppressionAllocationStore, ttl: number, clockValue: clock.Clock): SuppressionAllocationStore {
  return new CachedSuppressionAllocationStore(
    inner,
    cache.newTtlCache<SuppressionAllocation>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects suppression allocations. Empty fields match all. */
export class SuppressionAllocationQuery {
  source: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minFloorValue: number, statuses: string[], limit: number) {
    this.source = source;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SuppressionAllocation): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SuppressionAllocation[]): SuppressionAllocation[] {
    const matched = collections.filter(items, (candidate: SuppressionAllocation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSuppressionAllocations(store: SuppressionAllocationStore, query: SuppressionAllocationQuery): SuppressionAllocation[] {
  return query.apply(store.list());
}
