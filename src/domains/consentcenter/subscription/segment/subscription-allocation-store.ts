import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SubscriptionAllocation } from "./subscription-allocation.js";

/** Keeps subscription allocations by code. */
export interface SubscriptionAllocationStore {
  find(code: string): SubscriptionAllocation | undefined;
  save(item: SubscriptionAllocation): void;
  remove(code: string): boolean;
  list(): SubscriptionAllocation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySubscriptionAllocationStore implements SubscriptionAllocationStore {
  items: Map<string, SubscriptionAllocation>;
  order: string[];

  constructor(items: Map<string, SubscriptionAllocation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SubscriptionAllocation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SubscriptionAllocation): void {
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

  list(): SubscriptionAllocation[] {
    const out: SubscriptionAllocation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySubscriptionAllocationStore(): SubscriptionAllocationStore {
  return new MemorySubscriptionAllocationStore(new Map<string, SubscriptionAllocation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSubscriptionAllocationStore implements SubscriptionAllocationStore {
  inner: SubscriptionAllocationStore;
  cache: cache.TtlCache<SubscriptionAllocation>;
  hits: number;
  misses: number;

  constructor(
    inner: SubscriptionAllocationStore,
    cacheValue: cache.TtlCache<SubscriptionAllocation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SubscriptionAllocation | undefined {
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

  save(item: SubscriptionAllocation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SubscriptionAllocation[] {
    return this.inner.list();
  }
}

export function newCachedSubscriptionAllocationStore(inner: SubscriptionAllocationStore, ttl: number, clockValue: clock.Clock): SubscriptionAllocationStore {
  return new CachedSubscriptionAllocationStore(
    inner,
    cache.newTtlCache<SubscriptionAllocation>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects subscription allocations. Empty fields match all. */
export class SubscriptionAllocationQuery {
  locale: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SubscriptionAllocation): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SubscriptionAllocation[]): SubscriptionAllocation[] {
    const matched = collections.filter(items, (candidate: SubscriptionAllocation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSubscriptionAllocations(store: SubscriptionAllocationStore, query: SubscriptionAllocationQuery): SubscriptionAllocation[] {
  return query.apply(store.list());
}
