import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalLevelAdjustment } from "./global-level-adjustment.js";

/** Keeps global level adjustments by code. */
export interface GlobalLevelAdjustmentStore {
  find(code: string): GlobalLevelAdjustment | undefined;
  save(item: GlobalLevelAdjustment): void;
  remove(code: string): boolean;
  list(): GlobalLevelAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalLevelAdjustmentStore implements GlobalLevelAdjustmentStore {
  items: Map<string, GlobalLevelAdjustment>;
  order: string[];

  constructor(items: Map<string, GlobalLevelAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalLevelAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalLevelAdjustment): void {
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

  list(): GlobalLevelAdjustment[] {
    const out: GlobalLevelAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalLevelAdjustmentStore(): GlobalLevelAdjustmentStore {
  return new MemoryGlobalLevelAdjustmentStore(new Map<string, GlobalLevelAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalLevelAdjustmentStore implements GlobalLevelAdjustmentStore {
  inner: GlobalLevelAdjustmentStore;
  cache: cache.TtlCache<GlobalLevelAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalLevelAdjustmentStore,
    cacheValue: cache.TtlCache<GlobalLevelAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalLevelAdjustment | undefined {
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

  save(item: GlobalLevelAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalLevelAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedGlobalLevelAdjustmentStore(inner: GlobalLevelAdjustmentStore, ttl: number, clockValue: clock.Clock): GlobalLevelAdjustmentStore {
  return new CachedGlobalLevelAdjustmentStore(
    inner,
    cache.newTtlCache<GlobalLevelAdjustment>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects global level adjustments. Empty fields match all. */
export class GlobalLevelAdjustmentQuery {
  source: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minQuantity: number, statuses: string[], limit: number) {
    this.source = source;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalLevelAdjustment): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalLevelAdjustment[]): GlobalLevelAdjustment[] {
    const matched = collections.filter(items, (candidate: GlobalLevelAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalLevelAdjustments(store: GlobalLevelAdjustmentStore, query: GlobalLevelAdjustmentQuery): GlobalLevelAdjustment[] {
  return query.apply(store.list());
}
