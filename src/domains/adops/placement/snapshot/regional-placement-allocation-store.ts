import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalPlacementAllocation } from "./regional-placement-allocation.js";

/** Keeps regional placement allocations by code. */
export interface RegionalPlacementAllocationStore {
  find(code: string): RegionalPlacementAllocation | undefined;
  save(item: RegionalPlacementAllocation): void;
  remove(code: string): boolean;
  list(): RegionalPlacementAllocation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalPlacementAllocationStore implements RegionalPlacementAllocationStore {
  items: Map<string, RegionalPlacementAllocation>;
  order: string[];

  constructor(items: Map<string, RegionalPlacementAllocation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalPlacementAllocation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalPlacementAllocation): void {
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

  list(): RegionalPlacementAllocation[] {
    const out: RegionalPlacementAllocation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalPlacementAllocationStore(): RegionalPlacementAllocationStore {
  return new MemoryRegionalPlacementAllocationStore(new Map<string, RegionalPlacementAllocation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalPlacementAllocationStore implements RegionalPlacementAllocationStore {
  inner: RegionalPlacementAllocationStore;
  cache: cache.TtlCache<RegionalPlacementAllocation>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalPlacementAllocationStore,
    cacheValue: cache.TtlCache<RegionalPlacementAllocation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalPlacementAllocation | undefined {
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

  save(item: RegionalPlacementAllocation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalPlacementAllocation[] {
    return this.inner.list();
  }
}

export function newCachedRegionalPlacementAllocationStore(inner: RegionalPlacementAllocationStore, ttl: number, clockValue: clock.Clock): RegionalPlacementAllocationStore {
  return new CachedRegionalPlacementAllocationStore(
    inner,
    cache.newTtlCache<RegionalPlacementAllocation>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional placement allocations. Empty fields match all. */
export class RegionalPlacementAllocationQuery {
  title: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minEndsAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalPlacementAllocation): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalPlacementAllocation[]): RegionalPlacementAllocation[] {
    const matched = collections.filter(items, (candidate: RegionalPlacementAllocation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalPlacementAllocations(store: RegionalPlacementAllocationStore, query: RegionalPlacementAllocationQuery): RegionalPlacementAllocation[] {
  return query.apply(store.list());
}
