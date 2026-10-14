import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackActivationAllocation } from "./fallback-activation-allocation.js";

/** Keeps fallback activation allocations by code. */
export interface FallbackActivationAllocationStore {
  find(code: string): FallbackActivationAllocation | undefined;
  save(item: FallbackActivationAllocation): void;
  remove(code: string): boolean;
  list(): FallbackActivationAllocation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackActivationAllocationStore implements FallbackActivationAllocationStore {
  items: Map<string, FallbackActivationAllocation>;
  order: string[];

  constructor(items: Map<string, FallbackActivationAllocation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackActivationAllocation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackActivationAllocation): void {
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

  list(): FallbackActivationAllocation[] {
    const out: FallbackActivationAllocation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackActivationAllocationStore(): FallbackActivationAllocationStore {
  return new MemoryFallbackActivationAllocationStore(new Map<string, FallbackActivationAllocation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackActivationAllocationStore implements FallbackActivationAllocationStore {
  inner: FallbackActivationAllocationStore;
  cache: cache.TtlCache<FallbackActivationAllocation>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackActivationAllocationStore,
    cacheValue: cache.TtlCache<FallbackActivationAllocation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackActivationAllocation | undefined {
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

  save(item: FallbackActivationAllocation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackActivationAllocation[] {
    return this.inner.list();
  }
}

export function newCachedFallbackActivationAllocationStore(inner: FallbackActivationAllocationStore, ttl: number, clockValue: clock.Clock): FallbackActivationAllocationStore {
  return new CachedFallbackActivationAllocationStore(
    inner,
    cache.newTtlCache<FallbackActivationAllocation>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback activation allocations. Empty fields match all. */
export class FallbackActivationAllocationQuery {
  region: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.region = region;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackActivationAllocation): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackActivationAllocation[]): FallbackActivationAllocation[] {
    const matched = collections.filter(items, (candidate: FallbackActivationAllocation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackActivationAllocations(store: FallbackActivationAllocationStore, query: FallbackActivationAllocationQuery): FallbackActivationAllocation[] {
  return query.apply(store.list());
}
