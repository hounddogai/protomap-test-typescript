import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { EnrollmentAllocation } from "./enrollment-allocation.js";

/** Keeps enrollment allocations by code. */
export interface EnrollmentAllocationStore {
  find(code: string): EnrollmentAllocation | undefined;
  save(item: EnrollmentAllocation): void;
  remove(code: string): boolean;
  list(): EnrollmentAllocation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryEnrollmentAllocationStore implements EnrollmentAllocationStore {
  items: Map<string, EnrollmentAllocation>;
  order: string[];

  constructor(items: Map<string, EnrollmentAllocation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): EnrollmentAllocation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: EnrollmentAllocation): void {
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

  list(): EnrollmentAllocation[] {
    const out: EnrollmentAllocation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryEnrollmentAllocationStore(): EnrollmentAllocationStore {
  return new MemoryEnrollmentAllocationStore(new Map<string, EnrollmentAllocation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedEnrollmentAllocationStore implements EnrollmentAllocationStore {
  inner: EnrollmentAllocationStore;
  cache: cache.TtlCache<EnrollmentAllocation>;
  hits: number;
  misses: number;

  constructor(
    inner: EnrollmentAllocationStore,
    cacheValue: cache.TtlCache<EnrollmentAllocation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): EnrollmentAllocation | undefined {
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

  save(item: EnrollmentAllocation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): EnrollmentAllocation[] {
    return this.inner.list();
  }
}

export function newCachedEnrollmentAllocationStore(inner: EnrollmentAllocationStore, ttl: number, clockValue: clock.Clock): EnrollmentAllocationStore {
  return new CachedEnrollmentAllocationStore(
    inner,
    cache.newTtlCache<EnrollmentAllocation>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects enrollment allocations. Empty fields match all. */
export class EnrollmentAllocationQuery {
  channel: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minConversionRate: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: EnrollmentAllocation): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: EnrollmentAllocation[]): EnrollmentAllocation[] {
    const matched = collections.filter(items, (candidate: EnrollmentAllocation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findEnrollmentAllocations(store: EnrollmentAllocationStore, query: EnrollmentAllocationQuery): EnrollmentAllocation[] {
  return query.apply(store.list());
}
