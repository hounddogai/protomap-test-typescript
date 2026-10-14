import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ComplaintAllocation } from "./complaint-allocation.js";

/** Keeps complaint allocations by code. */
export interface ComplaintAllocationStore {
  find(code: string): ComplaintAllocation | undefined;
  save(item: ComplaintAllocation): void;
  remove(code: string): boolean;
  list(): ComplaintAllocation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryComplaintAllocationStore implements ComplaintAllocationStore {
  items: Map<string, ComplaintAllocation>;
  order: string[];

  constructor(items: Map<string, ComplaintAllocation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ComplaintAllocation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ComplaintAllocation): void {
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

  list(): ComplaintAllocation[] {
    const out: ComplaintAllocation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryComplaintAllocationStore(): ComplaintAllocationStore {
  return new MemoryComplaintAllocationStore(new Map<string, ComplaintAllocation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedComplaintAllocationStore implements ComplaintAllocationStore {
  inner: ComplaintAllocationStore;
  cache: cache.TtlCache<ComplaintAllocation>;
  hits: number;
  misses: number;

  constructor(
    inner: ComplaintAllocationStore,
    cacheValue: cache.TtlCache<ComplaintAllocation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ComplaintAllocation | undefined {
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

  save(item: ComplaintAllocation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ComplaintAllocation[] {
    return this.inner.list();
  }
}

export function newCachedComplaintAllocationStore(inner: ComplaintAllocationStore, ttl: number, clockValue: clock.Clock): ComplaintAllocationStore {
  return new CachedComplaintAllocationStore(inner, cache.newTtlCache<ComplaintAllocation>(64, ttl, clockValue), 0, 0);
}

/** Selects complaint allocations. Empty fields match all. */
export class ComplaintAllocationQuery {
  segment: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ComplaintAllocation): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ComplaintAllocation[]): ComplaintAllocation[] {
    const matched = collections.filter(items, (candidate: ComplaintAllocation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findComplaintAllocations(store: ComplaintAllocationStore, query: ComplaintAllocationQuery): ComplaintAllocation[] {
  return query.apply(store.list());
}
