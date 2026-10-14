import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CreativeAllocation } from "./creative-allocation.js";

/** Keeps creative allocations by code. */
export interface CreativeAllocationStore {
  find(code: string): CreativeAllocation | undefined;
  save(item: CreativeAllocation): void;
  remove(code: string): boolean;
  list(): CreativeAllocation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCreativeAllocationStore implements CreativeAllocationStore {
  items: Map<string, CreativeAllocation>;
  order: string[];

  constructor(items: Map<string, CreativeAllocation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CreativeAllocation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CreativeAllocation): void {
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

  list(): CreativeAllocation[] {
    const out: CreativeAllocation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCreativeAllocationStore(): CreativeAllocationStore {
  return new MemoryCreativeAllocationStore(new Map<string, CreativeAllocation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCreativeAllocationStore implements CreativeAllocationStore {
  inner: CreativeAllocationStore;
  cache: cache.TtlCache<CreativeAllocation>;
  hits: number;
  misses: number;

  constructor(
    inner: CreativeAllocationStore,
    cacheValue: cache.TtlCache<CreativeAllocation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CreativeAllocation | undefined {
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

  save(item: CreativeAllocation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CreativeAllocation[] {
    return this.inner.list();
  }
}

export function newCachedCreativeAllocationStore(inner: CreativeAllocationStore, ttl: number, clockValue: clock.Clock): CreativeAllocationStore {
  return new CachedCreativeAllocationStore(inner, cache.newTtlCache<CreativeAllocation>(256, ttl, clockValue), 0, 0);
}

/** Selects creative allocations. Empty fields match all. */
export class CreativeAllocationQuery {
  category: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minWindowDays: number, statuses: string[], limit: number) {
    this.category = category;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CreativeAllocation): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CreativeAllocation[]): CreativeAllocation[] {
    const matched = collections.filter(items, (candidate: CreativeAllocation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCreativeAllocations(store: CreativeAllocationStore, query: CreativeAllocationQuery): CreativeAllocation[] {
  return query.apply(store.list());
}
