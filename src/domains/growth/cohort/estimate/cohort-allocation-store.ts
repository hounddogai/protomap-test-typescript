import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CohortAllocation } from "./cohort-allocation.js";

/** Keeps cohort allocations by code. */
export interface CohortAllocationStore {
  find(code: string): CohortAllocation | undefined;
  save(item: CohortAllocation): void;
  remove(code: string): boolean;
  list(): CohortAllocation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCohortAllocationStore implements CohortAllocationStore {
  items: Map<string, CohortAllocation>;
  order: string[];

  constructor(items: Map<string, CohortAllocation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CohortAllocation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CohortAllocation): void {
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

  list(): CohortAllocation[] {
    const out: CohortAllocation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCohortAllocationStore(): CohortAllocationStore {
  return new MemoryCohortAllocationStore(new Map<string, CohortAllocation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCohortAllocationStore implements CohortAllocationStore {
  inner: CohortAllocationStore;
  cache: cache.TtlCache<CohortAllocation>;
  hits: number;
  misses: number;

  constructor(
    inner: CohortAllocationStore,
    cacheValue: cache.TtlCache<CohortAllocation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CohortAllocation | undefined {
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

  save(item: CohortAllocation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CohortAllocation[] {
    return this.inner.list();
  }
}

export function newCachedCohortAllocationStore(inner: CohortAllocationStore, ttl: number, clockValue: clock.Clock): CohortAllocationStore {
  return new CachedCohortAllocationStore(inner, cache.newTtlCache<CohortAllocation>(256, ttl, clockValue), 0, 0);
}

/** Selects cohort allocations. Empty fields match all. */
export class CohortAllocationQuery {
  channel: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minVersion: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CohortAllocation): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CohortAllocation[]): CohortAllocation[] {
    const matched = collections.filter(items, (candidate: CohortAllocation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCohortAllocations(store: CohortAllocationStore, query: CohortAllocationQuery): CohortAllocation[] {
  return query.apply(store.list());
}
