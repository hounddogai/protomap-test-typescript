import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BadgeAdjustment } from "./badge-adjustment.js";

/** Keeps badge adjustments by code. */
export interface BadgeAdjustmentStore {
  find(code: string): BadgeAdjustment | undefined;
  save(item: BadgeAdjustment): void;
  remove(code: string): boolean;
  list(): BadgeAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBadgeAdjustmentStore implements BadgeAdjustmentStore {
  items: Map<string, BadgeAdjustment>;
  order: string[];

  constructor(items: Map<string, BadgeAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BadgeAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BadgeAdjustment): void {
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

  list(): BadgeAdjustment[] {
    const out: BadgeAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBadgeAdjustmentStore(): BadgeAdjustmentStore {
  return new MemoryBadgeAdjustmentStore(new Map<string, BadgeAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBadgeAdjustmentStore implements BadgeAdjustmentStore {
  inner: BadgeAdjustmentStore;
  cache: cache.TtlCache<BadgeAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: BadgeAdjustmentStore,
    cacheValue: cache.TtlCache<BadgeAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BadgeAdjustment | undefined {
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

  save(item: BadgeAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BadgeAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedBadgeAdjustmentStore(inner: BadgeAdjustmentStore, ttl: number, clockValue: clock.Clock): BadgeAdjustmentStore {
  return new CachedBadgeAdjustmentStore(inner, cache.newTtlCache<BadgeAdjustment>(1024, ttl, clockValue), 0, 0);
}

/** Selects badge adjustments. Empty fields match all. */
export class BadgeAdjustmentQuery {
  segment: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minMargin: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BadgeAdjustment): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BadgeAdjustment[]): BadgeAdjustment[] {
    const matched = collections.filter(items, (candidate: BadgeAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBadgeAdjustments(store: BadgeAdjustmentStore, query: BadgeAdjustmentQuery): BadgeAdjustment[] {
  return query.apply(store.list());
}
