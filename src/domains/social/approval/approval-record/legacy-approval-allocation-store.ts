import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyApprovalAllocation } from "./legacy-approval-allocation.js";

/** Keeps legacy approval allocations by code. */
export interface LegacyApprovalAllocationStore {
  find(code: string): LegacyApprovalAllocation | undefined;
  save(item: LegacyApprovalAllocation): void;
  remove(code: string): boolean;
  list(): LegacyApprovalAllocation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyApprovalAllocationStore implements LegacyApprovalAllocationStore {
  items: Map<string, LegacyApprovalAllocation>;
  order: string[];

  constructor(items: Map<string, LegacyApprovalAllocation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyApprovalAllocation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyApprovalAllocation): void {
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

  list(): LegacyApprovalAllocation[] {
    const out: LegacyApprovalAllocation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyApprovalAllocationStore(): LegacyApprovalAllocationStore {
  return new MemoryLegacyApprovalAllocationStore(new Map<string, LegacyApprovalAllocation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyApprovalAllocationStore implements LegacyApprovalAllocationStore {
  inner: LegacyApprovalAllocationStore;
  cache: cache.TtlCache<LegacyApprovalAllocation>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyApprovalAllocationStore,
    cacheValue: cache.TtlCache<LegacyApprovalAllocation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyApprovalAllocation | undefined {
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

  save(item: LegacyApprovalAllocation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyApprovalAllocation[] {
    return this.inner.list();
  }
}

export function newCachedLegacyApprovalAllocationStore(inner: LegacyApprovalAllocationStore, ttl: number, clockValue: clock.Clock): LegacyApprovalAllocationStore {
  return new CachedLegacyApprovalAllocationStore(
    inner,
    cache.newTtlCache<LegacyApprovalAllocation>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy approval allocations. Empty fields match all. */
export class LegacyApprovalAllocationQuery {
  region: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minQuantity: number, statuses: string[], limit: number) {
    this.region = region;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyApprovalAllocation): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyApprovalAllocation[]): LegacyApprovalAllocation[] {
    const matched = collections.filter(items, (candidate: LegacyApprovalAllocation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyApprovalAllocations(store: LegacyApprovalAllocationStore, query: LegacyApprovalAllocationQuery): LegacyApprovalAllocation[] {
  return query.apply(store.list());
}
