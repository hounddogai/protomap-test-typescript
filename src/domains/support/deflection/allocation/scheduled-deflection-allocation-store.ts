import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledDeflectionAllocation } from "./scheduled-deflection-allocation.js";

/** Keeps scheduled deflection allocations by code. */
export interface ScheduledDeflectionAllocationStore {
  find(code: string): ScheduledDeflectionAllocation | undefined;
  save(item: ScheduledDeflectionAllocation): void;
  remove(code: string): boolean;
  list(): ScheduledDeflectionAllocation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledDeflectionAllocationStore implements ScheduledDeflectionAllocationStore {
  items: Map<string, ScheduledDeflectionAllocation>;
  order: string[];

  constructor(items: Map<string, ScheduledDeflectionAllocation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledDeflectionAllocation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledDeflectionAllocation): void {
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

  list(): ScheduledDeflectionAllocation[] {
    const out: ScheduledDeflectionAllocation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledDeflectionAllocationStore(): ScheduledDeflectionAllocationStore {
  return new MemoryScheduledDeflectionAllocationStore(new Map<string, ScheduledDeflectionAllocation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledDeflectionAllocationStore implements ScheduledDeflectionAllocationStore {
  inner: ScheduledDeflectionAllocationStore;
  cache: cache.TtlCache<ScheduledDeflectionAllocation>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledDeflectionAllocationStore,
    cacheValue: cache.TtlCache<ScheduledDeflectionAllocation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledDeflectionAllocation | undefined {
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

  save(item: ScheduledDeflectionAllocation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledDeflectionAllocation[] {
    return this.inner.list();
  }
}

export function newCachedScheduledDeflectionAllocationStore(inner: ScheduledDeflectionAllocationStore, ttl: number, clockValue: clock.Clock): ScheduledDeflectionAllocationStore {
  return new CachedScheduledDeflectionAllocationStore(
    inner,
    cache.newTtlCache<ScheduledDeflectionAllocation>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled deflection allocations. Empty fields match all. */
export class ScheduledDeflectionAllocationQuery {
  label: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minThreshold: number, statuses: string[], limit: number) {
    this.label = label;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledDeflectionAllocation): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledDeflectionAllocation[]): ScheduledDeflectionAllocation[] {
    const matched = collections.filter(items, (candidate: ScheduledDeflectionAllocation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledDeflectionAllocations(store: ScheduledDeflectionAllocationStore, query: ScheduledDeflectionAllocationQuery): ScheduledDeflectionAllocation[] {
  return query.apply(store.list());
}
