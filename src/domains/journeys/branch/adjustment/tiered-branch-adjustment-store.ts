import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredBranchAdjustment } from "./tiered-branch-adjustment.js";

/** Keeps tiered branch adjustments by code. */
export interface TieredBranchAdjustmentStore {
  find(code: string): TieredBranchAdjustment | undefined;
  save(item: TieredBranchAdjustment): void;
  remove(code: string): boolean;
  list(): TieredBranchAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredBranchAdjustmentStore implements TieredBranchAdjustmentStore {
  items: Map<string, TieredBranchAdjustment>;
  order: string[];

  constructor(items: Map<string, TieredBranchAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredBranchAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredBranchAdjustment): void {
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

  list(): TieredBranchAdjustment[] {
    const out: TieredBranchAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredBranchAdjustmentStore(): TieredBranchAdjustmentStore {
  return new MemoryTieredBranchAdjustmentStore(new Map<string, TieredBranchAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredBranchAdjustmentStore implements TieredBranchAdjustmentStore {
  inner: TieredBranchAdjustmentStore;
  cache: cache.TtlCache<TieredBranchAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredBranchAdjustmentStore,
    cacheValue: cache.TtlCache<TieredBranchAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredBranchAdjustment | undefined {
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

  save(item: TieredBranchAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredBranchAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedTieredBranchAdjustmentStore(inner: TieredBranchAdjustmentStore, ttl: number, clockValue: clock.Clock): TieredBranchAdjustmentStore {
  return new CachedTieredBranchAdjustmentStore(
    inner,
    cache.newTtlCache<TieredBranchAdjustment>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered branch adjustments. Empty fields match all. */
export class TieredBranchAdjustmentQuery {
  label: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.label = label;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredBranchAdjustment): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredBranchAdjustment[]): TieredBranchAdjustment[] {
    const matched = collections.filter(items, (candidate: TieredBranchAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredBranchAdjustments(store: TieredBranchAdjustmentStore, query: TieredBranchAdjustmentQuery): TieredBranchAdjustment[] {
  return query.apply(store.list());
}
