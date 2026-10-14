import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingActivationAllocation } from "./pending-activation-allocation.js";

/** Keeps pending activation allocations by code. */
export interface PendingActivationAllocationStore {
  find(code: string): PendingActivationAllocation | undefined;
  save(item: PendingActivationAllocation): void;
  remove(code: string): boolean;
  list(): PendingActivationAllocation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingActivationAllocationStore implements PendingActivationAllocationStore {
  items: Map<string, PendingActivationAllocation>;
  order: string[];

  constructor(items: Map<string, PendingActivationAllocation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingActivationAllocation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingActivationAllocation): void {
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

  list(): PendingActivationAllocation[] {
    const out: PendingActivationAllocation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingActivationAllocationStore(): PendingActivationAllocationStore {
  return new MemoryPendingActivationAllocationStore(new Map<string, PendingActivationAllocation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingActivationAllocationStore implements PendingActivationAllocationStore {
  inner: PendingActivationAllocationStore;
  cache: cache.TtlCache<PendingActivationAllocation>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingActivationAllocationStore,
    cacheValue: cache.TtlCache<PendingActivationAllocation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingActivationAllocation | undefined {
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

  save(item: PendingActivationAllocation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingActivationAllocation[] {
    return this.inner.list();
  }
}

export function newCachedPendingActivationAllocationStore(inner: PendingActivationAllocationStore, ttl: number, clockValue: clock.Clock): PendingActivationAllocationStore {
  return new CachedPendingActivationAllocationStore(
    inner,
    cache.newTtlCache<PendingActivationAllocation>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending activation allocations. Empty fields match all. */
export class PendingActivationAllocationQuery {
  channel: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minPriority: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingActivationAllocation): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingActivationAllocation[]): PendingActivationAllocation[] {
    const matched = collections.filter(items, (candidate: PendingActivationAllocation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingActivationAllocations(store: PendingActivationAllocationStore, query: PendingActivationAllocationQuery): PendingActivationAllocation[] {
  return query.apply(store.list());
}
