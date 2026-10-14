import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledPreferenceAllocation } from "./scheduled-preference-allocation.js";

/** Keeps scheduled preference allocations by code. */
export interface ScheduledPreferenceAllocationStore {
  find(code: string): ScheduledPreferenceAllocation | undefined;
  save(item: ScheduledPreferenceAllocation): void;
  remove(code: string): boolean;
  list(): ScheduledPreferenceAllocation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledPreferenceAllocationStore implements ScheduledPreferenceAllocationStore {
  items: Map<string, ScheduledPreferenceAllocation>;
  order: string[];

  constructor(items: Map<string, ScheduledPreferenceAllocation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledPreferenceAllocation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledPreferenceAllocation): void {
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

  list(): ScheduledPreferenceAllocation[] {
    const out: ScheduledPreferenceAllocation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledPreferenceAllocationStore(): ScheduledPreferenceAllocationStore {
  return new MemoryScheduledPreferenceAllocationStore(new Map<string, ScheduledPreferenceAllocation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledPreferenceAllocationStore implements ScheduledPreferenceAllocationStore {
  inner: ScheduledPreferenceAllocationStore;
  cache: cache.TtlCache<ScheduledPreferenceAllocation>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledPreferenceAllocationStore,
    cacheValue: cache.TtlCache<ScheduledPreferenceAllocation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledPreferenceAllocation | undefined {
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

  save(item: ScheduledPreferenceAllocation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledPreferenceAllocation[] {
    return this.inner.list();
  }
}

export function newCachedScheduledPreferenceAllocationStore(inner: ScheduledPreferenceAllocationStore, ttl: number, clockValue: clock.Clock): ScheduledPreferenceAllocationStore {
  return new CachedScheduledPreferenceAllocationStore(
    inner,
    cache.newTtlCache<ScheduledPreferenceAllocation>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled preference allocations. Empty fields match all. */
export class ScheduledPreferenceAllocationQuery {
  channel: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minAmount: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledPreferenceAllocation): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledPreferenceAllocation[]): ScheduledPreferenceAllocation[] {
    const matched = collections.filter(items, (candidate: ScheduledPreferenceAllocation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledPreferenceAllocations(store: ScheduledPreferenceAllocationStore, query: ScheduledPreferenceAllocationQuery): ScheduledPreferenceAllocation[] {
  return query.apply(store.list());
}
