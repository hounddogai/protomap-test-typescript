import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RetentionAllocation } from "./retention-allocation.js";

/** Keeps retention allocations by code. */
export interface RetentionAllocationStore {
  find(code: string): RetentionAllocation | undefined;
  save(item: RetentionAllocation): void;
  remove(code: string): boolean;
  list(): RetentionAllocation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRetentionAllocationStore implements RetentionAllocationStore {
  items: Map<string, RetentionAllocation>;
  order: string[];

  constructor(items: Map<string, RetentionAllocation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RetentionAllocation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RetentionAllocation): void {
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

  list(): RetentionAllocation[] {
    const out: RetentionAllocation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRetentionAllocationStore(): RetentionAllocationStore {
  return new MemoryRetentionAllocationStore(new Map<string, RetentionAllocation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRetentionAllocationStore implements RetentionAllocationStore {
  inner: RetentionAllocationStore;
  cache: cache.TtlCache<RetentionAllocation>;
  hits: number;
  misses: number;

  constructor(
    inner: RetentionAllocationStore,
    cacheValue: cache.TtlCache<RetentionAllocation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RetentionAllocation | undefined {
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

  save(item: RetentionAllocation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RetentionAllocation[] {
    return this.inner.list();
  }
}

export function newCachedRetentionAllocationStore(inner: RetentionAllocationStore, ttl: number, clockValue: clock.Clock): RetentionAllocationStore {
  return new CachedRetentionAllocationStore(inner, cache.newTtlCache<RetentionAllocation>(512, ttl, clockValue), 0, 0);
}

/** Selects retention allocations. Empty fields match all. */
export class RetentionAllocationQuery {
  channel: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minOpenRate: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RetentionAllocation): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RetentionAllocation[]): RetentionAllocation[] {
    const matched = collections.filter(items, (candidate: RetentionAllocation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRetentionAllocations(store: RetentionAllocationStore, query: RetentionAllocationQuery): RetentionAllocation[] {
  return query.apply(store.list());
}
