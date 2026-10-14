import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TouchpointEstimate } from "./touchpoint-estimate.js";

/** Keeps touchpoint estimates by code. */
export interface TouchpointEstimateStore {
  find(code: string): TouchpointEstimate | undefined;
  save(item: TouchpointEstimate): void;
  remove(code: string): boolean;
  list(): TouchpointEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTouchpointEstimateStore implements TouchpointEstimateStore {
  items: Map<string, TouchpointEstimate>;
  order: string[];

  constructor(items: Map<string, TouchpointEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TouchpointEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TouchpointEstimate): void {
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

  list(): TouchpointEstimate[] {
    const out: TouchpointEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTouchpointEstimateStore(): TouchpointEstimateStore {
  return new MemoryTouchpointEstimateStore(new Map<string, TouchpointEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTouchpointEstimateStore implements TouchpointEstimateStore {
  inner: TouchpointEstimateStore;
  cache: cache.TtlCache<TouchpointEstimate>;
  hits: number;
  misses: number;

  constructor(
    inner: TouchpointEstimateStore,
    cacheValue: cache.TtlCache<TouchpointEstimate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TouchpointEstimate | undefined {
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

  save(item: TouchpointEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TouchpointEstimate[] {
    return this.inner.list();
  }
}

export function newCachedTouchpointEstimateStore(inner: TouchpointEstimateStore, ttl: number, clockValue: clock.Clock): TouchpointEstimateStore {
  return new CachedTouchpointEstimateStore(inner, cache.newTtlCache<TouchpointEstimate>(512, ttl, clockValue), 0, 0);
}

/** Selects touchpoint estimates. Empty fields match all. */
export class TouchpointEstimateQuery {
  segment: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minCapacity: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TouchpointEstimate): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TouchpointEstimate[]): TouchpointEstimate[] {
    const matched = collections.filter(items, (candidate: TouchpointEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTouchpointEstimates(store: TouchpointEstimateStore, query: TouchpointEstimateQuery): TouchpointEstimate[] {
  return query.apply(store.list());
}
