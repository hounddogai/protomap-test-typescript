import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CreditAllocation } from "./credit-allocation.js";

/** Keeps credit allocations by code. */
export interface CreditAllocationStore {
  find(code: string): CreditAllocation | undefined;
  save(item: CreditAllocation): void;
  remove(code: string): boolean;
  list(): CreditAllocation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCreditAllocationStore implements CreditAllocationStore {
  items: Map<string, CreditAllocation>;
  order: string[];

  constructor(items: Map<string, CreditAllocation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CreditAllocation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CreditAllocation): void {
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

  list(): CreditAllocation[] {
    const out: CreditAllocation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCreditAllocationStore(): CreditAllocationStore {
  return new MemoryCreditAllocationStore(new Map<string, CreditAllocation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCreditAllocationStore implements CreditAllocationStore {
  inner: CreditAllocationStore;
  cache: cache.TtlCache<CreditAllocation>;
  hits: number;
  misses: number;

  constructor(
    inner: CreditAllocationStore,
    cacheValue: cache.TtlCache<CreditAllocation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CreditAllocation | undefined {
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

  save(item: CreditAllocation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CreditAllocation[] {
    return this.inner.list();
  }
}

export function newCachedCreditAllocationStore(inner: CreditAllocationStore, ttl: number, clockValue: clock.Clock): CreditAllocationStore {
  return new CachedCreditAllocationStore(inner, cache.newTtlCache<CreditAllocation>(1024, ttl, clockValue), 0, 0);
}

/** Selects credit allocations. Empty fields match all. */
export class CreditAllocationQuery {
  name: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minBid: number, statuses: string[], limit: number) {
    this.name = name;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CreditAllocation): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CreditAllocation[]): CreditAllocation[] {
    const matched = collections.filter(items, (candidate: CreditAllocation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCreditAllocations(store: CreditAllocationStore, query: CreditAllocationQuery): CreditAllocation[] {
  return query.apply(store.list());
}
