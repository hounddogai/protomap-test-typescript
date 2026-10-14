import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredBadgeAdjustment } from "./tiered-badge-adjustment.js";

/** Keeps tiered badge adjustments by code. */
export interface TieredBadgeAdjustmentStore {
  find(code: string): TieredBadgeAdjustment | undefined;
  save(item: TieredBadgeAdjustment): void;
  remove(code: string): boolean;
  list(): TieredBadgeAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredBadgeAdjustmentStore implements TieredBadgeAdjustmentStore {
  items: Map<string, TieredBadgeAdjustment>;
  order: string[];

  constructor(items: Map<string, TieredBadgeAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredBadgeAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredBadgeAdjustment): void {
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

  list(): TieredBadgeAdjustment[] {
    const out: TieredBadgeAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredBadgeAdjustmentStore(): TieredBadgeAdjustmentStore {
  return new MemoryTieredBadgeAdjustmentStore(new Map<string, TieredBadgeAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredBadgeAdjustmentStore implements TieredBadgeAdjustmentStore {
  inner: TieredBadgeAdjustmentStore;
  cache: cache.TtlCache<TieredBadgeAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredBadgeAdjustmentStore,
    cacheValue: cache.TtlCache<TieredBadgeAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredBadgeAdjustment | undefined {
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

  save(item: TieredBadgeAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredBadgeAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedTieredBadgeAdjustmentStore(inner: TieredBadgeAdjustmentStore, ttl: number, clockValue: clock.Clock): TieredBadgeAdjustmentStore {
  return new CachedTieredBadgeAdjustmentStore(
    inner,
    cache.newTtlCache<TieredBadgeAdjustment>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered badge adjustments. Empty fields match all. */
export class TieredBadgeAdjustmentQuery {
  region: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minClicks: number, statuses: string[], limit: number) {
    this.region = region;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredBadgeAdjustment): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredBadgeAdjustment[]): TieredBadgeAdjustment[] {
    const matched = collections.filter(items, (candidate: TieredBadgeAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredBadgeAdjustments(store: TieredBadgeAdjustmentStore, query: TieredBadgeAdjustmentQuery): TieredBadgeAdjustment[] {
  return query.apply(store.list());
}
