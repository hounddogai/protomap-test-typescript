import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingQueueGroup } from "./pending-queue-group.js";

/** Keeps pending queue groups by code. */
export interface PendingQueueGroupStore {
  find(code: string): PendingQueueGroup | undefined;
  save(item: PendingQueueGroup): void;
  remove(code: string): boolean;
  list(): PendingQueueGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingQueueGroupStore implements PendingQueueGroupStore {
  items: Map<string, PendingQueueGroup>;
  order: string[];

  constructor(items: Map<string, PendingQueueGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingQueueGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingQueueGroup): void {
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

  list(): PendingQueueGroup[] {
    const out: PendingQueueGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingQueueGroupStore(): PendingQueueGroupStore {
  return new MemoryPendingQueueGroupStore(new Map<string, PendingQueueGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingQueueGroupStore implements PendingQueueGroupStore {
  inner: PendingQueueGroupStore;
  cache: cache.TtlCache<PendingQueueGroup>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingQueueGroupStore,
    cacheValue: cache.TtlCache<PendingQueueGroup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingQueueGroup | undefined {
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

  save(item: PendingQueueGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingQueueGroup[] {
    return this.inner.list();
  }
}

export function newCachedPendingQueueGroupStore(inner: PendingQueueGroupStore, ttl: number, clockValue: clock.Clock): PendingQueueGroupStore {
  return new CachedPendingQueueGroupStore(inner, cache.newTtlCache<PendingQueueGroup>(128, ttl, clockValue), 0, 0);
}

/** Selects pending queue groups. Empty fields match all. */
export class PendingQueueGroupQuery {
  segment: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minBid: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingQueueGroup): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingQueueGroup[]): PendingQueueGroup[] {
    const matched = collections.filter(items, (candidate: PendingQueueGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingQueueGroups(store: PendingQueueGroupStore, query: PendingQueueGroupQuery): PendingQueueGroup[] {
  return query.apply(store.list());
}
