import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PostAllocation } from "./post-allocation.js";

/** Keeps post allocations by code. */
export interface PostAllocationStore {
  find(code: string): PostAllocation | undefined;
  save(item: PostAllocation): void;
  remove(code: string): boolean;
  list(): PostAllocation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPostAllocationStore implements PostAllocationStore {
  items: Map<string, PostAllocation>;
  order: string[];

  constructor(items: Map<string, PostAllocation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PostAllocation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PostAllocation): void {
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

  list(): PostAllocation[] {
    const out: PostAllocation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPostAllocationStore(): PostAllocationStore {
  return new MemoryPostAllocationStore(new Map<string, PostAllocation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPostAllocationStore implements PostAllocationStore {
  inner: PostAllocationStore;
  cache: cache.TtlCache<PostAllocation>;
  hits: number;
  misses: number;

  constructor(
    inner: PostAllocationStore,
    cacheValue: cache.TtlCache<PostAllocation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PostAllocation | undefined {
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

  save(item: PostAllocation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PostAllocation[] {
    return this.inner.list();
  }
}

export function newCachedPostAllocationStore(inner: PostAllocationStore, ttl: number, clockValue: clock.Clock): PostAllocationStore {
  return new CachedPostAllocationStore(inner, cache.newTtlCache<PostAllocation>(512, ttl, clockValue), 0, 0);
}

/** Selects post allocations. Empty fields match all. */
export class PostAllocationQuery {
  category: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minFloorValue: number, statuses: string[], limit: number) {
    this.category = category;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PostAllocation): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PostAllocation[]): PostAllocation[] {
    const matched = collections.filter(items, (candidate: PostAllocation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPostAllocations(store: PostAllocationStore, query: PostAllocationQuery): PostAllocation[] {
  return query.apply(store.list());
}
