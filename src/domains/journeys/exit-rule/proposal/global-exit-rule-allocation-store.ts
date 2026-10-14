import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalExitRuleAllocation } from "./global-exit-rule-allocation.js";

/** Keeps global exit rule allocations by code. */
export interface GlobalExitRuleAllocationStore {
  find(code: string): GlobalExitRuleAllocation | undefined;
  save(item: GlobalExitRuleAllocation): void;
  remove(code: string): boolean;
  list(): GlobalExitRuleAllocation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalExitRuleAllocationStore implements GlobalExitRuleAllocationStore {
  items: Map<string, GlobalExitRuleAllocation>;
  order: string[];

  constructor(items: Map<string, GlobalExitRuleAllocation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalExitRuleAllocation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalExitRuleAllocation): void {
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

  list(): GlobalExitRuleAllocation[] {
    const out: GlobalExitRuleAllocation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalExitRuleAllocationStore(): GlobalExitRuleAllocationStore {
  return new MemoryGlobalExitRuleAllocationStore(new Map<string, GlobalExitRuleAllocation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalExitRuleAllocationStore implements GlobalExitRuleAllocationStore {
  inner: GlobalExitRuleAllocationStore;
  cache: cache.TtlCache<GlobalExitRuleAllocation>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalExitRuleAllocationStore,
    cacheValue: cache.TtlCache<GlobalExitRuleAllocation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalExitRuleAllocation | undefined {
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

  save(item: GlobalExitRuleAllocation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalExitRuleAllocation[] {
    return this.inner.list();
  }
}

export function newCachedGlobalExitRuleAllocationStore(inner: GlobalExitRuleAllocationStore, ttl: number, clockValue: clock.Clock): GlobalExitRuleAllocationStore {
  return new CachedGlobalExitRuleAllocationStore(
    inner,
    cache.newTtlCache<GlobalExitRuleAllocation>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects global exit rule allocations. Empty fields match all. */
export class GlobalExitRuleAllocationQuery {
  label: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalExitRuleAllocation): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalExitRuleAllocation[]): GlobalExitRuleAllocation[] {
    const matched = collections.filter(items, (candidate: GlobalExitRuleAllocation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalExitRuleAllocations(store: GlobalExitRuleAllocationStore, query: GlobalExitRuleAllocationQuery): GlobalExitRuleAllocation[] {
  return query.apply(store.list());
}
