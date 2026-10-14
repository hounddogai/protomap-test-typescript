import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyWarmupAllocation } from "./legacy-warmup-allocation.js";

/** Keeps legacy warmup allocations by code. */
export interface LegacyWarmupAllocationStore {
  find(code: string): LegacyWarmupAllocation | undefined;
  save(item: LegacyWarmupAllocation): void;
  remove(code: string): boolean;
  list(): LegacyWarmupAllocation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyWarmupAllocationStore implements LegacyWarmupAllocationStore {
  items: Map<string, LegacyWarmupAllocation>;
  order: string[];

  constructor(items: Map<string, LegacyWarmupAllocation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyWarmupAllocation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyWarmupAllocation): void {
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

  list(): LegacyWarmupAllocation[] {
    const out: LegacyWarmupAllocation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyWarmupAllocationStore(): LegacyWarmupAllocationStore {
  return new MemoryLegacyWarmupAllocationStore(new Map<string, LegacyWarmupAllocation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyWarmupAllocationStore implements LegacyWarmupAllocationStore {
  inner: LegacyWarmupAllocationStore;
  cache: cache.TtlCache<LegacyWarmupAllocation>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyWarmupAllocationStore,
    cacheValue: cache.TtlCache<LegacyWarmupAllocation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyWarmupAllocation | undefined {
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

  save(item: LegacyWarmupAllocation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyWarmupAllocation[] {
    return this.inner.list();
  }
}

export function newCachedLegacyWarmupAllocationStore(inner: LegacyWarmupAllocationStore, ttl: number, clockValue: clock.Clock): LegacyWarmupAllocationStore {
  return new CachedLegacyWarmupAllocationStore(
    inner,
    cache.newTtlCache<LegacyWarmupAllocation>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy warmup allocations. Empty fields match all. */
export class LegacyWarmupAllocationQuery {
  name: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minImpressions: number, statuses: string[], limit: number) {
    this.name = name;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyWarmupAllocation): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyWarmupAllocation[]): LegacyWarmupAllocation[] {
    const matched = collections.filter(items, (candidate: LegacyWarmupAllocation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyWarmupAllocations(store: LegacyWarmupAllocationStore, query: LegacyWarmupAllocationQuery): LegacyWarmupAllocation[] {
  return query.apply(store.list());
}
