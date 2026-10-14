import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TouchpointAdjustment } from "./touchpoint-adjustment.js";

/** Keeps touchpoint adjustments by code. */
export interface TouchpointAdjustmentStore {
  find(code: string): TouchpointAdjustment | undefined;
  save(item: TouchpointAdjustment): void;
  remove(code: string): boolean;
  list(): TouchpointAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTouchpointAdjustmentStore implements TouchpointAdjustmentStore {
  items: Map<string, TouchpointAdjustment>;
  order: string[];

  constructor(items: Map<string, TouchpointAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TouchpointAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TouchpointAdjustment): void {
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

  list(): TouchpointAdjustment[] {
    const out: TouchpointAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTouchpointAdjustmentStore(): TouchpointAdjustmentStore {
  return new MemoryTouchpointAdjustmentStore(new Map<string, TouchpointAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTouchpointAdjustmentStore implements TouchpointAdjustmentStore {
  inner: TouchpointAdjustmentStore;
  cache: cache.TtlCache<TouchpointAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: TouchpointAdjustmentStore,
    cacheValue: cache.TtlCache<TouchpointAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TouchpointAdjustment | undefined {
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

  save(item: TouchpointAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TouchpointAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedTouchpointAdjustmentStore(inner: TouchpointAdjustmentStore, ttl: number, clockValue: clock.Clock): TouchpointAdjustmentStore {
  return new CachedTouchpointAdjustmentStore(
    inner,
    cache.newTtlCache<TouchpointAdjustment>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects touchpoint adjustments. Empty fields match all. */
export class TouchpointAdjustmentQuery {
  unit: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minClicks: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TouchpointAdjustment): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TouchpointAdjustment[]): TouchpointAdjustment[] {
    const matched = collections.filter(items, (candidate: TouchpointAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTouchpointAdjustments(store: TouchpointAdjustmentStore, query: TouchpointAdjustmentQuery): TouchpointAdjustment[] {
  return query.apply(store.list());
}
