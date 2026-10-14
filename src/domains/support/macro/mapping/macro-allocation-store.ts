import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { MacroAllocation } from "./macro-allocation.js";

/** Keeps macro allocations by code. */
export interface MacroAllocationStore {
  find(code: string): MacroAllocation | undefined;
  save(item: MacroAllocation): void;
  remove(code: string): boolean;
  list(): MacroAllocation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryMacroAllocationStore implements MacroAllocationStore {
  items: Map<string, MacroAllocation>;
  order: string[];

  constructor(items: Map<string, MacroAllocation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): MacroAllocation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: MacroAllocation): void {
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

  list(): MacroAllocation[] {
    const out: MacroAllocation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryMacroAllocationStore(): MacroAllocationStore {
  return new MemoryMacroAllocationStore(new Map<string, MacroAllocation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedMacroAllocationStore implements MacroAllocationStore {
  inner: MacroAllocationStore;
  cache: cache.TtlCache<MacroAllocation>;
  hits: number;
  misses: number;

  constructor(
    inner: MacroAllocationStore,
    cacheValue: cache.TtlCache<MacroAllocation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): MacroAllocation | undefined {
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

  save(item: MacroAllocation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): MacroAllocation[] {
    return this.inner.list();
  }
}

export function newCachedMacroAllocationStore(inner: MacroAllocationStore, ttl: number, clockValue: clock.Clock): MacroAllocationStore {
  return new CachedMacroAllocationStore(inner, cache.newTtlCache<MacroAllocation>(1024, ttl, clockValue), 0, 0);
}

/** Selects macro allocations. Empty fields match all. */
export class MacroAllocationQuery {
  name: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: MacroAllocation): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: MacroAllocation[]): MacroAllocation[] {
    const matched = collections.filter(items, (candidate: MacroAllocation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findMacroAllocations(store: MacroAllocationStore, query: MacroAllocationQuery): MacroAllocation[] {
  return query.apply(store.list());
}
