import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingFunnelAdjustment } from "./pending-funnel-adjustment.js";

/** Keeps pending funnel adjustments by code. */
export interface PendingFunnelAdjustmentStore {
  find(code: string): PendingFunnelAdjustment | undefined;
  save(item: PendingFunnelAdjustment): void;
  remove(code: string): boolean;
  list(): PendingFunnelAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingFunnelAdjustmentStore implements PendingFunnelAdjustmentStore {
  items: Map<string, PendingFunnelAdjustment>;
  order: string[];

  constructor(items: Map<string, PendingFunnelAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingFunnelAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingFunnelAdjustment): void {
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

  list(): PendingFunnelAdjustment[] {
    const out: PendingFunnelAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingFunnelAdjustmentStore(): PendingFunnelAdjustmentStore {
  return new MemoryPendingFunnelAdjustmentStore(new Map<string, PendingFunnelAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingFunnelAdjustmentStore implements PendingFunnelAdjustmentStore {
  inner: PendingFunnelAdjustmentStore;
  cache: cache.TtlCache<PendingFunnelAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingFunnelAdjustmentStore,
    cacheValue: cache.TtlCache<PendingFunnelAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingFunnelAdjustment | undefined {
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

  save(item: PendingFunnelAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingFunnelAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedPendingFunnelAdjustmentStore(inner: PendingFunnelAdjustmentStore, ttl: number, clockValue: clock.Clock): PendingFunnelAdjustmentStore {
  return new CachedPendingFunnelAdjustmentStore(
    inner,
    cache.newTtlCache<PendingFunnelAdjustment>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending funnel adjustments. Empty fields match all. */
export class PendingFunnelAdjustmentQuery {
  title: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minQuantity: number, statuses: string[], limit: number) {
    this.title = title;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingFunnelAdjustment): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingFunnelAdjustment[]): PendingFunnelAdjustment[] {
    const matched = collections.filter(items, (candidate: PendingFunnelAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingFunnelAdjustments(store: PendingFunnelAdjustmentStore, query: PendingFunnelAdjustmentQuery): PendingFunnelAdjustment[] {
  return query.apply(store.list());
}
