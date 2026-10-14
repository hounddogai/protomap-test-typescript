import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BadgeAllocation } from "./badge-allocation.js";

/** Keeps badge allocations by code. */
export interface BadgeAllocationStore {
  find(code: string): BadgeAllocation | undefined;
  save(item: BadgeAllocation): void;
  remove(code: string): boolean;
  list(): BadgeAllocation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBadgeAllocationStore implements BadgeAllocationStore {
  items: Map<string, BadgeAllocation>;
  order: string[];

  constructor(items: Map<string, BadgeAllocation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BadgeAllocation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BadgeAllocation): void {
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

  list(): BadgeAllocation[] {
    const out: BadgeAllocation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBadgeAllocationStore(): BadgeAllocationStore {
  return new MemoryBadgeAllocationStore(new Map<string, BadgeAllocation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBadgeAllocationStore implements BadgeAllocationStore {
  inner: BadgeAllocationStore;
  cache: cache.TtlCache<BadgeAllocation>;
  hits: number;
  misses: number;

  constructor(
    inner: BadgeAllocationStore,
    cacheValue: cache.TtlCache<BadgeAllocation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BadgeAllocation | undefined {
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

  save(item: BadgeAllocation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BadgeAllocation[] {
    return this.inner.list();
  }
}

export function newCachedBadgeAllocationStore(inner: BadgeAllocationStore, ttl: number, clockValue: clock.Clock): BadgeAllocationStore {
  return new CachedBadgeAllocationStore(inner, cache.newTtlCache<BadgeAllocation>(1024, ttl, clockValue), 0, 0);
}

/** Selects badge allocations. Empty fields match all. */
export class BadgeAllocationQuery {
  unit: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minPriority: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BadgeAllocation): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BadgeAllocation[]): BadgeAllocation[] {
    const matched = collections.filter(items, (candidate: BadgeAllocation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBadgeAllocations(store: BadgeAllocationStore, query: BadgeAllocationQuery): BadgeAllocation[] {
  return query.apply(store.list());
}
