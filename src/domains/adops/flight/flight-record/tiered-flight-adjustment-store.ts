import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredFlightAdjustment } from "./tiered-flight-adjustment.js";

/** Keeps tiered flight adjustments by code. */
export interface TieredFlightAdjustmentStore {
  find(code: string): TieredFlightAdjustment | undefined;
  save(item: TieredFlightAdjustment): void;
  remove(code: string): boolean;
  list(): TieredFlightAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredFlightAdjustmentStore implements TieredFlightAdjustmentStore {
  items: Map<string, TieredFlightAdjustment>;
  order: string[];

  constructor(items: Map<string, TieredFlightAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredFlightAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredFlightAdjustment): void {
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

  list(): TieredFlightAdjustment[] {
    const out: TieredFlightAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredFlightAdjustmentStore(): TieredFlightAdjustmentStore {
  return new MemoryTieredFlightAdjustmentStore(new Map<string, TieredFlightAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredFlightAdjustmentStore implements TieredFlightAdjustmentStore {
  inner: TieredFlightAdjustmentStore;
  cache: cache.TtlCache<TieredFlightAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredFlightAdjustmentStore,
    cacheValue: cache.TtlCache<TieredFlightAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredFlightAdjustment | undefined {
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

  save(item: TieredFlightAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredFlightAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedTieredFlightAdjustmentStore(inner: TieredFlightAdjustmentStore, ttl: number, clockValue: clock.Clock): TieredFlightAdjustmentStore {
  return new CachedTieredFlightAdjustmentStore(
    inner,
    cache.newTtlCache<TieredFlightAdjustment>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered flight adjustments. Empty fields match all. */
export class TieredFlightAdjustmentQuery {
  title: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minThreshold: number, statuses: string[], limit: number) {
    this.title = title;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredFlightAdjustment): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredFlightAdjustment[]): TieredFlightAdjustment[] {
    const matched = collections.filter(items, (candidate: TieredFlightAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredFlightAdjustments(store: TieredFlightAdjustmentStore, query: TieredFlightAdjustmentQuery): TieredFlightAdjustment[] {
  return query.apply(store.list());
}
