import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FunnelSegment } from "./funnel-segment.js";

/** Keeps funnel segments by code. */
export interface FunnelSegmentStore {
  find(code: string): FunnelSegment | undefined;
  save(item: FunnelSegment): void;
  remove(code: string): boolean;
  list(): FunnelSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFunnelSegmentStore implements FunnelSegmentStore {
  items: Map<string, FunnelSegment>;
  order: string[];

  constructor(items: Map<string, FunnelSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FunnelSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FunnelSegment): void {
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

  list(): FunnelSegment[] {
    const out: FunnelSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFunnelSegmentStore(): FunnelSegmentStore {
  return new MemoryFunnelSegmentStore(new Map<string, FunnelSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFunnelSegmentStore implements FunnelSegmentStore {
  inner: FunnelSegmentStore;
  cache: cache.TtlCache<FunnelSegment>;
  hits: number;
  misses: number;

  constructor(inner: FunnelSegmentStore, cacheValue: cache.TtlCache<FunnelSegment>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FunnelSegment | undefined {
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

  save(item: FunnelSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FunnelSegment[] {
    return this.inner.list();
  }
}

export function newCachedFunnelSegmentStore(inner: FunnelSegmentStore, ttl: number, clockValue: clock.Clock): FunnelSegmentStore {
  return new CachedFunnelSegmentStore(inner, cache.newTtlCache<FunnelSegment>(1024, ttl, clockValue), 0, 0);
}

/** Selects funnel segments. Empty fields match all. */
export class FunnelSegmentQuery {
  category: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minFloorValue: number, statuses: string[], limit: number) {
    this.category = category;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FunnelSegment): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FunnelSegment[]): FunnelSegment[] {
    const matched = collections.filter(items, (candidate: FunnelSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFunnelSegments(store: FunnelSegmentStore, query: FunnelSegmentQuery): FunnelSegment[] {
  return query.apply(store.list());
}
