import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BadgeSegment } from "./badge-segment.js";

/** Keeps badge segments by code. */
export interface BadgeSegmentStore {
  find(code: string): BadgeSegment | undefined;
  save(item: BadgeSegment): void;
  remove(code: string): boolean;
  list(): BadgeSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBadgeSegmentStore implements BadgeSegmentStore {
  items: Map<string, BadgeSegment>;
  order: string[];

  constructor(items: Map<string, BadgeSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BadgeSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BadgeSegment): void {
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

  list(): BadgeSegment[] {
    const out: BadgeSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBadgeSegmentStore(): BadgeSegmentStore {
  return new MemoryBadgeSegmentStore(new Map<string, BadgeSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBadgeSegmentStore implements BadgeSegmentStore {
  inner: BadgeSegmentStore;
  cache: cache.TtlCache<BadgeSegment>;
  hits: number;
  misses: number;

  constructor(inner: BadgeSegmentStore, cacheValue: cache.TtlCache<BadgeSegment>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BadgeSegment | undefined {
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

  save(item: BadgeSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BadgeSegment[] {
    return this.inner.list();
  }
}

export function newCachedBadgeSegmentStore(inner: BadgeSegmentStore, ttl: number, clockValue: clock.Clock): BadgeSegmentStore {
  return new CachedBadgeSegmentStore(inner, cache.newTtlCache<BadgeSegment>(256, ttl, clockValue), 0, 0);
}

/** Selects badge segments. Empty fields match all. */
export class BadgeSegmentQuery {
  region: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minCapacity: number, statuses: string[], limit: number) {
    this.region = region;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BadgeSegment): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BadgeSegment[]): BadgeSegment[] {
    const matched = collections.filter(items, (candidate: BadgeSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBadgeSegments(store: BadgeSegmentStore, query: BadgeSegmentQuery): BadgeSegment[] {
  return query.apply(store.list());
}
