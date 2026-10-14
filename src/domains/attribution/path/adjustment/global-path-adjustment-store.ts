import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalPathAdjustment } from "./global-path-adjustment.js";

/** Keeps global path adjustments by code. */
export interface GlobalPathAdjustmentStore {
  find(code: string): GlobalPathAdjustment | undefined;
  save(item: GlobalPathAdjustment): void;
  remove(code: string): boolean;
  list(): GlobalPathAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalPathAdjustmentStore implements GlobalPathAdjustmentStore {
  items: Map<string, GlobalPathAdjustment>;
  order: string[];

  constructor(items: Map<string, GlobalPathAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalPathAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalPathAdjustment): void {
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

  list(): GlobalPathAdjustment[] {
    const out: GlobalPathAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalPathAdjustmentStore(): GlobalPathAdjustmentStore {
  return new MemoryGlobalPathAdjustmentStore(new Map<string, GlobalPathAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalPathAdjustmentStore implements GlobalPathAdjustmentStore {
  inner: GlobalPathAdjustmentStore;
  cache: cache.TtlCache<GlobalPathAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalPathAdjustmentStore,
    cacheValue: cache.TtlCache<GlobalPathAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalPathAdjustment | undefined {
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

  save(item: GlobalPathAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalPathAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedGlobalPathAdjustmentStore(inner: GlobalPathAdjustmentStore, ttl: number, clockValue: clock.Clock): GlobalPathAdjustmentStore {
  return new CachedGlobalPathAdjustmentStore(
    inner,
    cache.newTtlCache<GlobalPathAdjustment>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects global path adjustments. Empty fields match all. */
export class GlobalPathAdjustmentQuery {
  utmSource: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minAmount: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalPathAdjustment): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalPathAdjustment[]): GlobalPathAdjustment[] {
    const matched = collections.filter(items, (candidate: GlobalPathAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalPathAdjustments(store: GlobalPathAdjustmentStore, query: GlobalPathAdjustmentQuery): GlobalPathAdjustment[] {
  return query.apply(store.list());
}
