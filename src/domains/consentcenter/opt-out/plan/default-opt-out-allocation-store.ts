import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultOptOutAllocation } from "./default-opt-out-allocation.js";

/** Keeps default opt out allocations by code. */
export interface DefaultOptOutAllocationStore {
  find(code: string): DefaultOptOutAllocation | undefined;
  save(item: DefaultOptOutAllocation): void;
  remove(code: string): boolean;
  list(): DefaultOptOutAllocation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultOptOutAllocationStore implements DefaultOptOutAllocationStore {
  items: Map<string, DefaultOptOutAllocation>;
  order: string[];

  constructor(items: Map<string, DefaultOptOutAllocation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultOptOutAllocation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultOptOutAllocation): void {
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

  list(): DefaultOptOutAllocation[] {
    const out: DefaultOptOutAllocation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultOptOutAllocationStore(): DefaultOptOutAllocationStore {
  return new MemoryDefaultOptOutAllocationStore(new Map<string, DefaultOptOutAllocation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultOptOutAllocationStore implements DefaultOptOutAllocationStore {
  inner: DefaultOptOutAllocationStore;
  cache: cache.TtlCache<DefaultOptOutAllocation>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultOptOutAllocationStore,
    cacheValue: cache.TtlCache<DefaultOptOutAllocation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultOptOutAllocation | undefined {
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

  save(item: DefaultOptOutAllocation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultOptOutAllocation[] {
    return this.inner.list();
  }
}

export function newCachedDefaultOptOutAllocationStore(inner: DefaultOptOutAllocationStore, ttl: number, clockValue: clock.Clock): DefaultOptOutAllocationStore {
  return new CachedDefaultOptOutAllocationStore(
    inner,
    cache.newTtlCache<DefaultOptOutAllocation>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default opt out allocations. Empty fields match all. */
export class DefaultOptOutAllocationQuery {
  locale: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minRate: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultOptOutAllocation): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultOptOutAllocation[]): DefaultOptOutAllocation[] {
    const matched = collections.filter(items, (candidate: DefaultOptOutAllocation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultOptOutAllocations(store: DefaultOptOutAllocationStore, query: DefaultOptOutAllocationQuery): DefaultOptOutAllocation[] {
  return query.apply(store.list());
}
