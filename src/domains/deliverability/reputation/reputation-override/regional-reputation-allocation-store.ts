import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalReputationAllocation } from "./regional-reputation-allocation.js";

/** Keeps regional reputation allocations by code. */
export interface RegionalReputationAllocationStore {
  find(code: string): RegionalReputationAllocation | undefined;
  save(item: RegionalReputationAllocation): void;
  remove(code: string): boolean;
  list(): RegionalReputationAllocation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalReputationAllocationStore implements RegionalReputationAllocationStore {
  items: Map<string, RegionalReputationAllocation>;
  order: string[];

  constructor(items: Map<string, RegionalReputationAllocation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalReputationAllocation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalReputationAllocation): void {
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

  list(): RegionalReputationAllocation[] {
    const out: RegionalReputationAllocation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalReputationAllocationStore(): RegionalReputationAllocationStore {
  return new MemoryRegionalReputationAllocationStore(new Map<string, RegionalReputationAllocation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalReputationAllocationStore implements RegionalReputationAllocationStore {
  inner: RegionalReputationAllocationStore;
  cache: cache.TtlCache<RegionalReputationAllocation>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalReputationAllocationStore,
    cacheValue: cache.TtlCache<RegionalReputationAllocation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalReputationAllocation | undefined {
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

  save(item: RegionalReputationAllocation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalReputationAllocation[] {
    return this.inner.list();
  }
}

export function newCachedRegionalReputationAllocationStore(inner: RegionalReputationAllocationStore, ttl: number, clockValue: clock.Clock): RegionalReputationAllocationStore {
  return new CachedRegionalReputationAllocationStore(
    inner,
    cache.newTtlCache<RegionalReputationAllocation>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional reputation allocations. Empty fields match all. */
export class RegionalReputationAllocationQuery {
  source: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minBid: number, statuses: string[], limit: number) {
    this.source = source;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalReputationAllocation): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalReputationAllocation[]): RegionalReputationAllocation[] {
    const matched = collections.filter(items, (candidate: RegionalReputationAllocation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalReputationAllocations(store: RegionalReputationAllocationStore, query: RegionalReputationAllocationQuery): RegionalReputationAllocation[] {
  return query.apply(store.list());
}
