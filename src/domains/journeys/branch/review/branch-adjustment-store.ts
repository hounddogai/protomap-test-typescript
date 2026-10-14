import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BranchAdjustment } from "./branch-adjustment.js";

/** Keeps branch adjustments by code. */
export interface BranchAdjustmentStore {
  find(code: string): BranchAdjustment | undefined;
  save(item: BranchAdjustment): void;
  remove(code: string): boolean;
  list(): BranchAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBranchAdjustmentStore implements BranchAdjustmentStore {
  items: Map<string, BranchAdjustment>;
  order: string[];

  constructor(items: Map<string, BranchAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BranchAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BranchAdjustment): void {
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

  list(): BranchAdjustment[] {
    const out: BranchAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBranchAdjustmentStore(): BranchAdjustmentStore {
  return new MemoryBranchAdjustmentStore(new Map<string, BranchAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBranchAdjustmentStore implements BranchAdjustmentStore {
  inner: BranchAdjustmentStore;
  cache: cache.TtlCache<BranchAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: BranchAdjustmentStore,
    cacheValue: cache.TtlCache<BranchAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BranchAdjustment | undefined {
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

  save(item: BranchAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BranchAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedBranchAdjustmentStore(inner: BranchAdjustmentStore, ttl: number, clockValue: clock.Clock): BranchAdjustmentStore {
  return new CachedBranchAdjustmentStore(inner, cache.newTtlCache<BranchAdjustment>(512, ttl, clockValue), 0, 0);
}

/** Selects branch adjustments. Empty fields match all. */
export class BranchAdjustmentQuery {
  utmSource: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minMargin: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BranchAdjustment): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BranchAdjustment[]): BranchAdjustment[] {
    const matched = collections.filter(items, (candidate: BranchAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBranchAdjustments(store: BranchAdjustmentStore, query: BranchAdjustmentQuery): BranchAdjustment[] {
  return query.apply(store.list());
}
