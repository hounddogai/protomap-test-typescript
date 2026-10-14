import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveMentionAllocation } from "./adaptive-mention-allocation.js";

/** Keeps adaptive mention allocations by code. */
export interface AdaptiveMentionAllocationStore {
  find(code: string): AdaptiveMentionAllocation | undefined;
  save(item: AdaptiveMentionAllocation): void;
  remove(code: string): boolean;
  list(): AdaptiveMentionAllocation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveMentionAllocationStore implements AdaptiveMentionAllocationStore {
  items: Map<string, AdaptiveMentionAllocation>;
  order: string[];

  constructor(items: Map<string, AdaptiveMentionAllocation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveMentionAllocation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveMentionAllocation): void {
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

  list(): AdaptiveMentionAllocation[] {
    const out: AdaptiveMentionAllocation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveMentionAllocationStore(): AdaptiveMentionAllocationStore {
  return new MemoryAdaptiveMentionAllocationStore(new Map<string, AdaptiveMentionAllocation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveMentionAllocationStore implements AdaptiveMentionAllocationStore {
  inner: AdaptiveMentionAllocationStore;
  cache: cache.TtlCache<AdaptiveMentionAllocation>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveMentionAllocationStore,
    cacheValue: cache.TtlCache<AdaptiveMentionAllocation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveMentionAllocation | undefined {
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

  save(item: AdaptiveMentionAllocation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveMentionAllocation[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveMentionAllocationStore(inner: AdaptiveMentionAllocationStore, ttl: number, clockValue: clock.Clock): AdaptiveMentionAllocationStore {
  return new CachedAdaptiveMentionAllocationStore(
    inner,
    cache.newTtlCache<AdaptiveMentionAllocation>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive mention allocations. Empty fields match all. */
export class AdaptiveMentionAllocationQuery {
  name: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minScore: number, statuses: string[], limit: number) {
    this.name = name;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveMentionAllocation): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveMentionAllocation[]): AdaptiveMentionAllocation[] {
    const matched = collections.filter(items, (candidate: AdaptiveMentionAllocation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveMentionAllocations(store: AdaptiveMentionAllocationStore, query: AdaptiveMentionAllocationQuery): AdaptiveMentionAllocation[] {
  return query.apply(store.list());
}
