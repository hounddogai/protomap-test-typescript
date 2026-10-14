import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TouchpointBaseline } from "./touchpoint-baseline.js";

/** Keeps touchpoint baselines by code. */
export interface TouchpointBaselineStore {
  find(code: string): TouchpointBaseline | undefined;
  save(item: TouchpointBaseline): void;
  remove(code: string): boolean;
  list(): TouchpointBaseline[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTouchpointBaselineStore implements TouchpointBaselineStore {
  items: Map<string, TouchpointBaseline>;
  order: string[];

  constructor(items: Map<string, TouchpointBaseline>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TouchpointBaseline | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TouchpointBaseline): void {
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

  list(): TouchpointBaseline[] {
    const out: TouchpointBaseline[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTouchpointBaselineStore(): TouchpointBaselineStore {
  return new MemoryTouchpointBaselineStore(new Map<string, TouchpointBaseline>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTouchpointBaselineStore implements TouchpointBaselineStore {
  inner: TouchpointBaselineStore;
  cache: cache.TtlCache<TouchpointBaseline>;
  hits: number;
  misses: number;

  constructor(
    inner: TouchpointBaselineStore,
    cacheValue: cache.TtlCache<TouchpointBaseline>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TouchpointBaseline | undefined {
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

  save(item: TouchpointBaseline): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TouchpointBaseline[] {
    return this.inner.list();
  }
}

export function newCachedTouchpointBaselineStore(inner: TouchpointBaselineStore, ttl: number, clockValue: clock.Clock): TouchpointBaselineStore {
  return new CachedTouchpointBaselineStore(inner, cache.newTtlCache<TouchpointBaseline>(512, ttl, clockValue), 0, 0);
}

/** Selects touchpoint baselines. Empty fields match all. */
export class TouchpointBaselineQuery {
  unit: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minBid: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TouchpointBaseline): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TouchpointBaseline[]): TouchpointBaseline[] {
    const matched = collections.filter(items, (candidate: TouchpointBaseline): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTouchpointBaselines(store: TouchpointBaselineStore, query: TouchpointBaselineQuery): TouchpointBaseline[] {
  return query.apply(store.list());
}
