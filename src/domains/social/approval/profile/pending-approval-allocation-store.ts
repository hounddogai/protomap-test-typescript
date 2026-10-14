import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingApprovalAllocation } from "./pending-approval-allocation.js";

/** Keeps pending approval allocations by code. */
export interface PendingApprovalAllocationStore {
  find(code: string): PendingApprovalAllocation | undefined;
  save(item: PendingApprovalAllocation): void;
  remove(code: string): boolean;
  list(): PendingApprovalAllocation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingApprovalAllocationStore implements PendingApprovalAllocationStore {
  items: Map<string, PendingApprovalAllocation>;
  order: string[];

  constructor(items: Map<string, PendingApprovalAllocation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingApprovalAllocation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingApprovalAllocation): void {
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

  list(): PendingApprovalAllocation[] {
    const out: PendingApprovalAllocation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingApprovalAllocationStore(): PendingApprovalAllocationStore {
  return new MemoryPendingApprovalAllocationStore(new Map<string, PendingApprovalAllocation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingApprovalAllocationStore implements PendingApprovalAllocationStore {
  inner: PendingApprovalAllocationStore;
  cache: cache.TtlCache<PendingApprovalAllocation>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingApprovalAllocationStore,
    cacheValue: cache.TtlCache<PendingApprovalAllocation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingApprovalAllocation | undefined {
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

  save(item: PendingApprovalAllocation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingApprovalAllocation[] {
    return this.inner.list();
  }
}

export function newCachedPendingApprovalAllocationStore(inner: PendingApprovalAllocationStore, ttl: number, clockValue: clock.Clock): PendingApprovalAllocationStore {
  return new CachedPendingApprovalAllocationStore(
    inner,
    cache.newTtlCache<PendingApprovalAllocation>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending approval allocations. Empty fields match all. */
export class PendingApprovalAllocationQuery {
  locale: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingApprovalAllocation): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingApprovalAllocation[]): PendingApprovalAllocation[] {
    const matched = collections.filter(items, (candidate: PendingApprovalAllocation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingApprovalAllocations(store: PendingApprovalAllocationStore, query: PendingApprovalAllocationQuery): PendingApprovalAllocation[] {
  return query.apply(store.list());
}
