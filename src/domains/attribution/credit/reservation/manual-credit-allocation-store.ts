import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualCreditAllocation } from "./manual-credit-allocation.js";

/** Keeps manual credit allocations by code. */
export interface ManualCreditAllocationStore {
  find(code: string): ManualCreditAllocation | undefined;
  save(item: ManualCreditAllocation): void;
  remove(code: string): boolean;
  list(): ManualCreditAllocation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualCreditAllocationStore implements ManualCreditAllocationStore {
  items: Map<string, ManualCreditAllocation>;
  order: string[];

  constructor(items: Map<string, ManualCreditAllocation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualCreditAllocation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualCreditAllocation): void {
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

  list(): ManualCreditAllocation[] {
    const out: ManualCreditAllocation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualCreditAllocationStore(): ManualCreditAllocationStore {
  return new MemoryManualCreditAllocationStore(new Map<string, ManualCreditAllocation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualCreditAllocationStore implements ManualCreditAllocationStore {
  inner: ManualCreditAllocationStore;
  cache: cache.TtlCache<ManualCreditAllocation>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualCreditAllocationStore,
    cacheValue: cache.TtlCache<ManualCreditAllocation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualCreditAllocation | undefined {
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

  save(item: ManualCreditAllocation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualCreditAllocation[] {
    return this.inner.list();
  }
}

export function newCachedManualCreditAllocationStore(inner: ManualCreditAllocationStore, ttl: number, clockValue: clock.Clock): ManualCreditAllocationStore {
  return new CachedManualCreditAllocationStore(
    inner,
    cache.newTtlCache<ManualCreditAllocation>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects manual credit allocations. Empty fields match all. */
export class ManualCreditAllocationQuery {
  title: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualCreditAllocation): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualCreditAllocation[]): ManualCreditAllocation[] {
    const matched = collections.filter(items, (candidate: ManualCreditAllocation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualCreditAllocations(store: ManualCreditAllocationStore, query: ManualCreditAllocationQuery): ManualCreditAllocation[] {
  return query.apply(store.list());
}
