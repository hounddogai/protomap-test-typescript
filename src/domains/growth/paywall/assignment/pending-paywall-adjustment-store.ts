import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingPaywallAdjustment } from "./pending-paywall-adjustment.js";

/** Keeps pending paywall adjustments by code. */
export interface PendingPaywallAdjustmentStore {
  find(code: string): PendingPaywallAdjustment | undefined;
  save(item: PendingPaywallAdjustment): void;
  remove(code: string): boolean;
  list(): PendingPaywallAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingPaywallAdjustmentStore implements PendingPaywallAdjustmentStore {
  items: Map<string, PendingPaywallAdjustment>;
  order: string[];

  constructor(items: Map<string, PendingPaywallAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingPaywallAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingPaywallAdjustment): void {
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

  list(): PendingPaywallAdjustment[] {
    const out: PendingPaywallAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingPaywallAdjustmentStore(): PendingPaywallAdjustmentStore {
  return new MemoryPendingPaywallAdjustmentStore(new Map<string, PendingPaywallAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingPaywallAdjustmentStore implements PendingPaywallAdjustmentStore {
  inner: PendingPaywallAdjustmentStore;
  cache: cache.TtlCache<PendingPaywallAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingPaywallAdjustmentStore,
    cacheValue: cache.TtlCache<PendingPaywallAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingPaywallAdjustment | undefined {
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

  save(item: PendingPaywallAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingPaywallAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedPendingPaywallAdjustmentStore(inner: PendingPaywallAdjustmentStore, ttl: number, clockValue: clock.Clock): PendingPaywallAdjustmentStore {
  return new CachedPendingPaywallAdjustmentStore(
    inner,
    cache.newTtlCache<PendingPaywallAdjustment>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending paywall adjustments. Empty fields match all. */
export class PendingPaywallAdjustmentQuery {
  segment: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minBatchSize: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingPaywallAdjustment): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingPaywallAdjustment[]): PendingPaywallAdjustment[] {
    const matched = collections.filter(items, (candidate: PendingPaywallAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingPaywallAdjustments(store: PendingPaywallAdjustmentStore, query: PendingPaywallAdjustmentQuery): PendingPaywallAdjustment[] {
  return query.apply(store.list());
}
