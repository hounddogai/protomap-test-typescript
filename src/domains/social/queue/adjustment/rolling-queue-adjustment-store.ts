import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingQueueAdjustment } from "./rolling-queue-adjustment.js";

/** Keeps rolling queue adjustments by code. */
export interface RollingQueueAdjustmentStore {
  find(code: string): RollingQueueAdjustment | undefined;
  save(item: RollingQueueAdjustment): void;
  remove(code: string): boolean;
  list(): RollingQueueAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingQueueAdjustmentStore implements RollingQueueAdjustmentStore {
  items: Map<string, RollingQueueAdjustment>;
  order: string[];

  constructor(items: Map<string, RollingQueueAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingQueueAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingQueueAdjustment): void {
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

  list(): RollingQueueAdjustment[] {
    const out: RollingQueueAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingQueueAdjustmentStore(): RollingQueueAdjustmentStore {
  return new MemoryRollingQueueAdjustmentStore(new Map<string, RollingQueueAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingQueueAdjustmentStore implements RollingQueueAdjustmentStore {
  inner: RollingQueueAdjustmentStore;
  cache: cache.TtlCache<RollingQueueAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingQueueAdjustmentStore,
    cacheValue: cache.TtlCache<RollingQueueAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingQueueAdjustment | undefined {
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

  save(item: RollingQueueAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingQueueAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedRollingQueueAdjustmentStore(inner: RollingQueueAdjustmentStore, ttl: number, clockValue: clock.Clock): RollingQueueAdjustmentStore {
  return new CachedRollingQueueAdjustmentStore(
    inner,
    cache.newTtlCache<RollingQueueAdjustment>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling queue adjustments. Empty fields match all. */
export class RollingQueueAdjustmentQuery {
  category: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minBid: number, statuses: string[], limit: number) {
    this.category = category;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingQueueAdjustment): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingQueueAdjustment[]): RollingQueueAdjustment[] {
    const matched = collections.filter(items, (candidate: RollingQueueAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingQueueAdjustments(store: RollingQueueAdjustmentStore, query: RollingQueueAdjustmentQuery): RollingQueueAdjustment[] {
  return query.apply(store.list());
}
