import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalEscalationAllocation } from "./global-escalation-allocation.js";

/** Keeps global escalation allocations by code. */
export interface GlobalEscalationAllocationStore {
  find(code: string): GlobalEscalationAllocation | undefined;
  save(item: GlobalEscalationAllocation): void;
  remove(code: string): boolean;
  list(): GlobalEscalationAllocation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalEscalationAllocationStore implements GlobalEscalationAllocationStore {
  items: Map<string, GlobalEscalationAllocation>;
  order: string[];

  constructor(items: Map<string, GlobalEscalationAllocation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalEscalationAllocation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalEscalationAllocation): void {
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

  list(): GlobalEscalationAllocation[] {
    const out: GlobalEscalationAllocation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalEscalationAllocationStore(): GlobalEscalationAllocationStore {
  return new MemoryGlobalEscalationAllocationStore(new Map<string, GlobalEscalationAllocation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalEscalationAllocationStore implements GlobalEscalationAllocationStore {
  inner: GlobalEscalationAllocationStore;
  cache: cache.TtlCache<GlobalEscalationAllocation>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalEscalationAllocationStore,
    cacheValue: cache.TtlCache<GlobalEscalationAllocation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalEscalationAllocation | undefined {
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

  save(item: GlobalEscalationAllocation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalEscalationAllocation[] {
    return this.inner.list();
  }
}

export function newCachedGlobalEscalationAllocationStore(inner: GlobalEscalationAllocationStore, ttl: number, clockValue: clock.Clock): GlobalEscalationAllocationStore {
  return new CachedGlobalEscalationAllocationStore(
    inner,
    cache.newTtlCache<GlobalEscalationAllocation>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects global escalation allocations. Empty fields match all. */
export class GlobalEscalationAllocationQuery {
  label: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minQuantity: number, statuses: string[], limit: number) {
    this.label = label;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalEscalationAllocation): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalEscalationAllocation[]): GlobalEscalationAllocation[] {
    const matched = collections.filter(items, (candidate: GlobalEscalationAllocation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalEscalationAllocations(store: GlobalEscalationAllocationStore, query: GlobalEscalationAllocationQuery): GlobalEscalationAllocation[] {
  return query.apply(store.list());
}
