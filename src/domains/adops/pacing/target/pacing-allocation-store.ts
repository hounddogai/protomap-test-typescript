import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PacingAllocation } from "./pacing-allocation.js";

/** Keeps pacing allocations by code. */
export interface PacingAllocationStore {
  find(code: string): PacingAllocation | undefined;
  save(item: PacingAllocation): void;
  remove(code: string): boolean;
  list(): PacingAllocation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPacingAllocationStore implements PacingAllocationStore {
  items: Map<string, PacingAllocation>;
  order: string[];

  constructor(items: Map<string, PacingAllocation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PacingAllocation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PacingAllocation): void {
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

  list(): PacingAllocation[] {
    const out: PacingAllocation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPacingAllocationStore(): PacingAllocationStore {
  return new MemoryPacingAllocationStore(new Map<string, PacingAllocation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPacingAllocationStore implements PacingAllocationStore {
  inner: PacingAllocationStore;
  cache: cache.TtlCache<PacingAllocation>;
  hits: number;
  misses: number;

  constructor(
    inner: PacingAllocationStore,
    cacheValue: cache.TtlCache<PacingAllocation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PacingAllocation | undefined {
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

  save(item: PacingAllocation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PacingAllocation[] {
    return this.inner.list();
  }
}

export function newCachedPacingAllocationStore(inner: PacingAllocationStore, ttl: number, clockValue: clock.Clock): PacingAllocationStore {
  return new CachedPacingAllocationStore(inner, cache.newTtlCache<PacingAllocation>(128, ttl, clockValue), 0, 0);
}

/** Selects pacing allocations. Empty fields match all. */
export class PacingAllocationQuery {
  name: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PacingAllocation): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PacingAllocation[]): PacingAllocation[] {
    const matched = collections.filter(items, (candidate: PacingAllocation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPacingAllocations(store: PacingAllocationStore, query: PacingAllocationQuery): PacingAllocation[] {
  return query.apply(store.list());
}
