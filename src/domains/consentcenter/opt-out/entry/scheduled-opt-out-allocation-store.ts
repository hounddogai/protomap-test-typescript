import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledOptOutAllocation } from "./scheduled-opt-out-allocation.js";

/** Keeps scheduled opt out allocations by code. */
export interface ScheduledOptOutAllocationStore {
  find(code: string): ScheduledOptOutAllocation | undefined;
  save(item: ScheduledOptOutAllocation): void;
  remove(code: string): boolean;
  list(): ScheduledOptOutAllocation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledOptOutAllocationStore implements ScheduledOptOutAllocationStore {
  items: Map<string, ScheduledOptOutAllocation>;
  order: string[];

  constructor(items: Map<string, ScheduledOptOutAllocation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledOptOutAllocation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledOptOutAllocation): void {
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

  list(): ScheduledOptOutAllocation[] {
    const out: ScheduledOptOutAllocation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledOptOutAllocationStore(): ScheduledOptOutAllocationStore {
  return new MemoryScheduledOptOutAllocationStore(new Map<string, ScheduledOptOutAllocation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledOptOutAllocationStore implements ScheduledOptOutAllocationStore {
  inner: ScheduledOptOutAllocationStore;
  cache: cache.TtlCache<ScheduledOptOutAllocation>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledOptOutAllocationStore,
    cacheValue: cache.TtlCache<ScheduledOptOutAllocation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledOptOutAllocation | undefined {
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

  save(item: ScheduledOptOutAllocation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledOptOutAllocation[] {
    return this.inner.list();
  }
}

export function newCachedScheduledOptOutAllocationStore(inner: ScheduledOptOutAllocationStore, ttl: number, clockValue: clock.Clock): ScheduledOptOutAllocationStore {
  return new CachedScheduledOptOutAllocationStore(
    inner,
    cache.newTtlCache<ScheduledOptOutAllocation>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled opt out allocations. Empty fields match all. */
export class ScheduledOptOutAllocationQuery {
  locale: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minBudget: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledOptOutAllocation): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledOptOutAllocation[]): ScheduledOptOutAllocation[] {
    const matched = collections.filter(items, (candidate: ScheduledOptOutAllocation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledOptOutAllocations(store: ScheduledOptOutAllocationStore, query: ScheduledOptOutAllocationQuery): ScheduledOptOutAllocation[] {
  return query.apply(store.list());
}
