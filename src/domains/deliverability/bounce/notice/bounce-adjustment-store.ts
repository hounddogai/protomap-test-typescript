import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BounceAdjustment } from "./bounce-adjustment.js";

/** Keeps bounce adjustments by code. */
export interface BounceAdjustmentStore {
  find(code: string): BounceAdjustment | undefined;
  save(item: BounceAdjustment): void;
  remove(code: string): boolean;
  list(): BounceAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBounceAdjustmentStore implements BounceAdjustmentStore {
  items: Map<string, BounceAdjustment>;
  order: string[];

  constructor(items: Map<string, BounceAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BounceAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BounceAdjustment): void {
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

  list(): BounceAdjustment[] {
    const out: BounceAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBounceAdjustmentStore(): BounceAdjustmentStore {
  return new MemoryBounceAdjustmentStore(new Map<string, BounceAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBounceAdjustmentStore implements BounceAdjustmentStore {
  inner: BounceAdjustmentStore;
  cache: cache.TtlCache<BounceAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: BounceAdjustmentStore,
    cacheValue: cache.TtlCache<BounceAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BounceAdjustment | undefined {
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

  save(item: BounceAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BounceAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedBounceAdjustmentStore(inner: BounceAdjustmentStore, ttl: number, clockValue: clock.Clock): BounceAdjustmentStore {
  return new CachedBounceAdjustmentStore(inner, cache.newTtlCache<BounceAdjustment>(256, ttl, clockValue), 0, 0);
}

/** Selects bounce adjustments. Empty fields match all. */
export class BounceAdjustmentQuery {
  locale: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minBid: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BounceAdjustment): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BounceAdjustment[]): BounceAdjustment[] {
    const matched = collections.filter(items, (candidate: BounceAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBounceAdjustments(store: BounceAdjustmentStore, query: BounceAdjustmentQuery): BounceAdjustment[] {
  return query.apply(store.list());
}
