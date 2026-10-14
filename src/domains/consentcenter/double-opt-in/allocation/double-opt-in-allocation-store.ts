import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DoubleOptInAllocation } from "./double-opt-in-allocation.js";

/** Keeps double opt in allocations by code. */
export interface DoubleOptInAllocationStore {
  find(code: string): DoubleOptInAllocation | undefined;
  save(item: DoubleOptInAllocation): void;
  remove(code: string): boolean;
  list(): DoubleOptInAllocation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDoubleOptInAllocationStore implements DoubleOptInAllocationStore {
  items: Map<string, DoubleOptInAllocation>;
  order: string[];

  constructor(items: Map<string, DoubleOptInAllocation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DoubleOptInAllocation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DoubleOptInAllocation): void {
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

  list(): DoubleOptInAllocation[] {
    const out: DoubleOptInAllocation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDoubleOptInAllocationStore(): DoubleOptInAllocationStore {
  return new MemoryDoubleOptInAllocationStore(new Map<string, DoubleOptInAllocation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDoubleOptInAllocationStore implements DoubleOptInAllocationStore {
  inner: DoubleOptInAllocationStore;
  cache: cache.TtlCache<DoubleOptInAllocation>;
  hits: number;
  misses: number;

  constructor(
    inner: DoubleOptInAllocationStore,
    cacheValue: cache.TtlCache<DoubleOptInAllocation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DoubleOptInAllocation | undefined {
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

  save(item: DoubleOptInAllocation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DoubleOptInAllocation[] {
    return this.inner.list();
  }
}

export function newCachedDoubleOptInAllocationStore(inner: DoubleOptInAllocationStore, ttl: number, clockValue: clock.Clock): DoubleOptInAllocationStore {
  return new CachedDoubleOptInAllocationStore(
    inner,
    cache.newTtlCache<DoubleOptInAllocation>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects double opt in allocations. Empty fields match all. */
export class DoubleOptInAllocationQuery {
  locale: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minMargin: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DoubleOptInAllocation): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DoubleOptInAllocation[]): DoubleOptInAllocation[] {
    const matched = collections.filter(items, (candidate: DoubleOptInAllocation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDoubleOptInAllocations(store: DoubleOptInAllocationStore, query: DoubleOptInAllocationQuery): DoubleOptInAllocation[] {
  return query.apply(store.list());
}
