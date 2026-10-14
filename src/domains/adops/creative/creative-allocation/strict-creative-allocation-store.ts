import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictCreativeAllocation } from "./strict-creative-allocation.js";

/** Keeps strict creative allocations by code. */
export interface StrictCreativeAllocationStore {
  find(code: string): StrictCreativeAllocation | undefined;
  save(item: StrictCreativeAllocation): void;
  remove(code: string): boolean;
  list(): StrictCreativeAllocation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictCreativeAllocationStore implements StrictCreativeAllocationStore {
  items: Map<string, StrictCreativeAllocation>;
  order: string[];

  constructor(items: Map<string, StrictCreativeAllocation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictCreativeAllocation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictCreativeAllocation): void {
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

  list(): StrictCreativeAllocation[] {
    const out: StrictCreativeAllocation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictCreativeAllocationStore(): StrictCreativeAllocationStore {
  return new MemoryStrictCreativeAllocationStore(new Map<string, StrictCreativeAllocation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictCreativeAllocationStore implements StrictCreativeAllocationStore {
  inner: StrictCreativeAllocationStore;
  cache: cache.TtlCache<StrictCreativeAllocation>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictCreativeAllocationStore,
    cacheValue: cache.TtlCache<StrictCreativeAllocation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictCreativeAllocation | undefined {
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

  save(item: StrictCreativeAllocation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictCreativeAllocation[] {
    return this.inner.list();
  }
}

export function newCachedStrictCreativeAllocationStore(inner: StrictCreativeAllocationStore, ttl: number, clockValue: clock.Clock): StrictCreativeAllocationStore {
  return new CachedStrictCreativeAllocationStore(
    inner,
    cache.newTtlCache<StrictCreativeAllocation>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects strict creative allocations. Empty fields match all. */
export class StrictCreativeAllocationQuery {
  title: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minAttempts: number, statuses: string[], limit: number) {
    this.title = title;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictCreativeAllocation): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictCreativeAllocation[]): StrictCreativeAllocation[] {
    const matched = collections.filter(items, (candidate: StrictCreativeAllocation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictCreativeAllocations(store: StrictCreativeAllocationStore, query: StrictCreativeAllocationQuery): StrictCreativeAllocation[] {
  return query.apply(store.list());
}
