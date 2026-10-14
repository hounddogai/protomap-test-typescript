import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledModelAllocation } from "./scheduled-model-allocation.js";

/** Keeps scheduled model allocations by code. */
export interface ScheduledModelAllocationStore {
  find(code: string): ScheduledModelAllocation | undefined;
  save(item: ScheduledModelAllocation): void;
  remove(code: string): boolean;
  list(): ScheduledModelAllocation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledModelAllocationStore implements ScheduledModelAllocationStore {
  items: Map<string, ScheduledModelAllocation>;
  order: string[];

  constructor(items: Map<string, ScheduledModelAllocation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledModelAllocation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledModelAllocation): void {
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

  list(): ScheduledModelAllocation[] {
    const out: ScheduledModelAllocation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledModelAllocationStore(): ScheduledModelAllocationStore {
  return new MemoryScheduledModelAllocationStore(new Map<string, ScheduledModelAllocation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledModelAllocationStore implements ScheduledModelAllocationStore {
  inner: ScheduledModelAllocationStore;
  cache: cache.TtlCache<ScheduledModelAllocation>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledModelAllocationStore,
    cacheValue: cache.TtlCache<ScheduledModelAllocation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledModelAllocation | undefined {
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

  save(item: ScheduledModelAllocation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledModelAllocation[] {
    return this.inner.list();
  }
}

export function newCachedScheduledModelAllocationStore(inner: ScheduledModelAllocationStore, ttl: number, clockValue: clock.Clock): ScheduledModelAllocationStore {
  return new CachedScheduledModelAllocationStore(
    inner,
    cache.newTtlCache<ScheduledModelAllocation>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled model allocations. Empty fields match all. */
export class ScheduledModelAllocationQuery {
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

  matches(item: ScheduledModelAllocation): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledModelAllocation[]): ScheduledModelAllocation[] {
    const matched = collections.filter(items, (candidate: ScheduledModelAllocation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledModelAllocations(store: ScheduledModelAllocationStore, query: ScheduledModelAllocationQuery): ScheduledModelAllocation[] {
  return query.apply(store.list());
}
