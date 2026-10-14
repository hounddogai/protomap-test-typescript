import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PaywallAllocation } from "./paywall-allocation.js";

/** Keeps paywall allocations by code. */
export interface PaywallAllocationStore {
  find(code: string): PaywallAllocation | undefined;
  save(item: PaywallAllocation): void;
  remove(code: string): boolean;
  list(): PaywallAllocation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPaywallAllocationStore implements PaywallAllocationStore {
  items: Map<string, PaywallAllocation>;
  order: string[];

  constructor(items: Map<string, PaywallAllocation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PaywallAllocation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PaywallAllocation): void {
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

  list(): PaywallAllocation[] {
    const out: PaywallAllocation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPaywallAllocationStore(): PaywallAllocationStore {
  return new MemoryPaywallAllocationStore(new Map<string, PaywallAllocation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPaywallAllocationStore implements PaywallAllocationStore {
  inner: PaywallAllocationStore;
  cache: cache.TtlCache<PaywallAllocation>;
  hits: number;
  misses: number;

  constructor(
    inner: PaywallAllocationStore,
    cacheValue: cache.TtlCache<PaywallAllocation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PaywallAllocation | undefined {
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

  save(item: PaywallAllocation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PaywallAllocation[] {
    return this.inner.list();
  }
}

export function newCachedPaywallAllocationStore(inner: PaywallAllocationStore, ttl: number, clockValue: clock.Clock): PaywallAllocationStore {
  return new CachedPaywallAllocationStore(inner, cache.newTtlCache<PaywallAllocation>(1024, ttl, clockValue), 0, 0);
}

/** Selects paywall allocations. Empty fields match all. */
export class PaywallAllocationQuery {
  unit: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minSequence: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PaywallAllocation): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PaywallAllocation[]): PaywallAllocation[] {
    const matched = collections.filter(items, (candidate: PaywallAllocation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPaywallAllocations(store: PaywallAllocationStore, query: PaywallAllocationQuery): PaywallAllocation[] {
  return query.apply(store.list());
}
