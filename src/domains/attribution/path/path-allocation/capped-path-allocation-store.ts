import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedPathAllocation } from "./capped-path-allocation.js";

/** Keeps capped path allocations by code. */
export interface CappedPathAllocationStore {
  find(code: string): CappedPathAllocation | undefined;
  save(item: CappedPathAllocation): void;
  remove(code: string): boolean;
  list(): CappedPathAllocation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedPathAllocationStore implements CappedPathAllocationStore {
  items: Map<string, CappedPathAllocation>;
  order: string[];

  constructor(items: Map<string, CappedPathAllocation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedPathAllocation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedPathAllocation): void {
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

  list(): CappedPathAllocation[] {
    const out: CappedPathAllocation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedPathAllocationStore(): CappedPathAllocationStore {
  return new MemoryCappedPathAllocationStore(new Map<string, CappedPathAllocation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedPathAllocationStore implements CappedPathAllocationStore {
  inner: CappedPathAllocationStore;
  cache: cache.TtlCache<CappedPathAllocation>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedPathAllocationStore,
    cacheValue: cache.TtlCache<CappedPathAllocation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedPathAllocation | undefined {
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

  save(item: CappedPathAllocation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedPathAllocation[] {
    return this.inner.list();
  }
}

export function newCachedCappedPathAllocationStore(inner: CappedPathAllocationStore, ttl: number, clockValue: clock.Clock): CappedPathAllocationStore {
  return new CachedCappedPathAllocationStore(
    inner,
    cache.newTtlCache<CappedPathAllocation>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects capped path allocations. Empty fields match all. */
export class CappedPathAllocationQuery {
  name: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.name = name;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedPathAllocation): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedPathAllocation[]): CappedPathAllocation[] {
    const matched = collections.filter(items, (candidate: CappedPathAllocation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedPathAllocations(store: CappedPathAllocationStore, query: CappedPathAllocationQuery): CappedPathAllocation[] {
  return query.apply(store.list());
}
