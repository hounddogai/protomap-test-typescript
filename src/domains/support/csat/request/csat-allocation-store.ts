import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CsatAllocation } from "./csat-allocation.js";

/** Keeps csat allocations by code. */
export interface CsatAllocationStore {
  find(code: string): CsatAllocation | undefined;
  save(item: CsatAllocation): void;
  remove(code: string): boolean;
  list(): CsatAllocation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCsatAllocationStore implements CsatAllocationStore {
  items: Map<string, CsatAllocation>;
  order: string[];

  constructor(items: Map<string, CsatAllocation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CsatAllocation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CsatAllocation): void {
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

  list(): CsatAllocation[] {
    const out: CsatAllocation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCsatAllocationStore(): CsatAllocationStore {
  return new MemoryCsatAllocationStore(new Map<string, CsatAllocation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCsatAllocationStore implements CsatAllocationStore {
  inner: CsatAllocationStore;
  cache: cache.TtlCache<CsatAllocation>;
  hits: number;
  misses: number;

  constructor(
    inner: CsatAllocationStore,
    cacheValue: cache.TtlCache<CsatAllocation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CsatAllocation | undefined {
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

  save(item: CsatAllocation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CsatAllocation[] {
    return this.inner.list();
  }
}

export function newCachedCsatAllocationStore(inner: CsatAllocationStore, ttl: number, clockValue: clock.Clock): CsatAllocationStore {
  return new CachedCsatAllocationStore(inner, cache.newTtlCache<CsatAllocation>(128, ttl, clockValue), 0, 0);
}

/** Selects csat allocations. Empty fields match all. */
export class CsatAllocationQuery {
  source: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minStartsAt: number, statuses: string[], limit: number) {
    this.source = source;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CsatAllocation): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CsatAllocation[]): CsatAllocation[] {
    const matched = collections.filter(items, (candidate: CsatAllocation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCsatAllocations(store: CsatAllocationStore, query: CsatAllocationQuery): CsatAllocation[] {
  return query.apply(store.list());
}
