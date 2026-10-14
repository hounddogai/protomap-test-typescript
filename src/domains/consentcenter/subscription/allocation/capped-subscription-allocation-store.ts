import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedSubscriptionAllocation } from "./capped-subscription-allocation.js";

/** Keeps capped subscription allocations by code. */
export interface CappedSubscriptionAllocationStore {
  find(code: string): CappedSubscriptionAllocation | undefined;
  save(item: CappedSubscriptionAllocation): void;
  remove(code: string): boolean;
  list(): CappedSubscriptionAllocation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedSubscriptionAllocationStore implements CappedSubscriptionAllocationStore {
  items: Map<string, CappedSubscriptionAllocation>;
  order: string[];

  constructor(items: Map<string, CappedSubscriptionAllocation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedSubscriptionAllocation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedSubscriptionAllocation): void {
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

  list(): CappedSubscriptionAllocation[] {
    const out: CappedSubscriptionAllocation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedSubscriptionAllocationStore(): CappedSubscriptionAllocationStore {
  return new MemoryCappedSubscriptionAllocationStore(new Map<string, CappedSubscriptionAllocation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedSubscriptionAllocationStore implements CappedSubscriptionAllocationStore {
  inner: CappedSubscriptionAllocationStore;
  cache: cache.TtlCache<CappedSubscriptionAllocation>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedSubscriptionAllocationStore,
    cacheValue: cache.TtlCache<CappedSubscriptionAllocation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedSubscriptionAllocation | undefined {
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

  save(item: CappedSubscriptionAllocation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedSubscriptionAllocation[] {
    return this.inner.list();
  }
}

export function newCachedCappedSubscriptionAllocationStore(inner: CappedSubscriptionAllocationStore, ttl: number, clockValue: clock.Clock): CappedSubscriptionAllocationStore {
  return new CachedCappedSubscriptionAllocationStore(
    inner,
    cache.newTtlCache<CappedSubscriptionAllocation>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects capped subscription allocations. Empty fields match all. */
export class CappedSubscriptionAllocationQuery {
  name: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minOpenRate: number, statuses: string[], limit: number) {
    this.name = name;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedSubscriptionAllocation): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedSubscriptionAllocation[]): CappedSubscriptionAllocation[] {
    const matched = collections.filter(items, (candidate: CappedSubscriptionAllocation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedSubscriptionAllocations(store: CappedSubscriptionAllocationStore, query: CappedSubscriptionAllocationQuery): CappedSubscriptionAllocation[] {
  return query.apply(store.list());
}
