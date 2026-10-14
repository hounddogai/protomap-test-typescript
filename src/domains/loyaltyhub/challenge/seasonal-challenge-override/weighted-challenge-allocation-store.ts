import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedChallengeAllocation } from "./weighted-challenge-allocation.js";

/** Keeps weighted challenge allocations by code. */
export interface WeightedChallengeAllocationStore {
  find(code: string): WeightedChallengeAllocation | undefined;
  save(item: WeightedChallengeAllocation): void;
  remove(code: string): boolean;
  list(): WeightedChallengeAllocation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedChallengeAllocationStore implements WeightedChallengeAllocationStore {
  items: Map<string, WeightedChallengeAllocation>;
  order: string[];

  constructor(items: Map<string, WeightedChallengeAllocation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedChallengeAllocation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedChallengeAllocation): void {
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

  list(): WeightedChallengeAllocation[] {
    const out: WeightedChallengeAllocation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedChallengeAllocationStore(): WeightedChallengeAllocationStore {
  return new MemoryWeightedChallengeAllocationStore(new Map<string, WeightedChallengeAllocation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedChallengeAllocationStore implements WeightedChallengeAllocationStore {
  inner: WeightedChallengeAllocationStore;
  cache: cache.TtlCache<WeightedChallengeAllocation>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedChallengeAllocationStore,
    cacheValue: cache.TtlCache<WeightedChallengeAllocation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedChallengeAllocation | undefined {
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

  save(item: WeightedChallengeAllocation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedChallengeAllocation[] {
    return this.inner.list();
  }
}

export function newCachedWeightedChallengeAllocationStore(inner: WeightedChallengeAllocationStore, ttl: number, clockValue: clock.Clock): WeightedChallengeAllocationStore {
  return new CachedWeightedChallengeAllocationStore(
    inner,
    cache.newTtlCache<WeightedChallengeAllocation>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted challenge allocations. Empty fields match all. */
export class WeightedChallengeAllocationQuery {
  title: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minWindowDays: number, statuses: string[], limit: number) {
    this.title = title;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedChallengeAllocation): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedChallengeAllocation[]): WeightedChallengeAllocation[] {
    const matched = collections.filter(items, (candidate: WeightedChallengeAllocation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedChallengeAllocations(store: WeightedChallengeAllocationStore, query: WeightedChallengeAllocationQuery): WeightedChallengeAllocation[] {
  return query.apply(store.list());
}
