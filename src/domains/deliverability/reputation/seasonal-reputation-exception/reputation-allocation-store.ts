import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ReputationAllocation } from "./reputation-allocation.js";

/** Keeps reputation allocations by code. */
export interface ReputationAllocationStore {
  find(code: string): ReputationAllocation | undefined;
  save(item: ReputationAllocation): void;
  remove(code: string): boolean;
  list(): ReputationAllocation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryReputationAllocationStore implements ReputationAllocationStore {
  items: Map<string, ReputationAllocation>;
  order: string[];

  constructor(items: Map<string, ReputationAllocation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ReputationAllocation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ReputationAllocation): void {
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

  list(): ReputationAllocation[] {
    const out: ReputationAllocation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryReputationAllocationStore(): ReputationAllocationStore {
  return new MemoryReputationAllocationStore(new Map<string, ReputationAllocation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedReputationAllocationStore implements ReputationAllocationStore {
  inner: ReputationAllocationStore;
  cache: cache.TtlCache<ReputationAllocation>;
  hits: number;
  misses: number;

  constructor(
    inner: ReputationAllocationStore,
    cacheValue: cache.TtlCache<ReputationAllocation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ReputationAllocation | undefined {
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

  save(item: ReputationAllocation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ReputationAllocation[] {
    return this.inner.list();
  }
}

export function newCachedReputationAllocationStore(inner: ReputationAllocationStore, ttl: number, clockValue: clock.Clock): ReputationAllocationStore {
  return new CachedReputationAllocationStore(
    inner,
    cache.newTtlCache<ReputationAllocation>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects reputation allocations. Empty fields match all. */
export class ReputationAllocationQuery {
  segment: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minGraceDays: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ReputationAllocation): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ReputationAllocation[]): ReputationAllocation[] {
    const matched = collections.filter(items, (candidate: ReputationAllocation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findReputationAllocations(store: ReputationAllocationStore, query: ReputationAllocationQuery): ReputationAllocation[] {
  return query.apply(store.list());
}
