import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ActivationAllocation } from "./activation-allocation.js";

/** Keeps activation allocations by code. */
export interface ActivationAllocationStore {
  find(code: string): ActivationAllocation | undefined;
  save(item: ActivationAllocation): void;
  remove(code: string): boolean;
  list(): ActivationAllocation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryActivationAllocationStore implements ActivationAllocationStore {
  items: Map<string, ActivationAllocation>;
  order: string[];

  constructor(items: Map<string, ActivationAllocation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ActivationAllocation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ActivationAllocation): void {
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

  list(): ActivationAllocation[] {
    const out: ActivationAllocation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryActivationAllocationStore(): ActivationAllocationStore {
  return new MemoryActivationAllocationStore(new Map<string, ActivationAllocation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedActivationAllocationStore implements ActivationAllocationStore {
  inner: ActivationAllocationStore;
  cache: cache.TtlCache<ActivationAllocation>;
  hits: number;
  misses: number;

  constructor(
    inner: ActivationAllocationStore,
    cacheValue: cache.TtlCache<ActivationAllocation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ActivationAllocation | undefined {
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

  save(item: ActivationAllocation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ActivationAllocation[] {
    return this.inner.list();
  }
}

export function newCachedActivationAllocationStore(inner: ActivationAllocationStore, ttl: number, clockValue: clock.Clock): ActivationAllocationStore {
  return new CachedActivationAllocationStore(
    inner,
    cache.newTtlCache<ActivationAllocation>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects activation allocations. Empty fields match all. */
export class ActivationAllocationQuery {
  category: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minSequence: number, statuses: string[], limit: number) {
    this.category = category;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ActivationAllocation): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ActivationAllocation[]): ActivationAllocation[] {
    const matched = collections.filter(items, (candidate: ActivationAllocation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findActivationAllocations(store: ActivationAllocationStore, query: ActivationAllocationQuery): ActivationAllocation[] {
  return query.apply(store.list());
}
