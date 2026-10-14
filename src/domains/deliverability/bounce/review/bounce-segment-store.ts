import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BounceSegment } from "./bounce-segment.js";

/** Keeps bounce segments by code. */
export interface BounceSegmentStore {
  find(code: string): BounceSegment | undefined;
  save(item: BounceSegment): void;
  remove(code: string): boolean;
  list(): BounceSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBounceSegmentStore implements BounceSegmentStore {
  items: Map<string, BounceSegment>;
  order: string[];

  constructor(items: Map<string, BounceSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BounceSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BounceSegment): void {
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

  list(): BounceSegment[] {
    const out: BounceSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBounceSegmentStore(): BounceSegmentStore {
  return new MemoryBounceSegmentStore(new Map<string, BounceSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBounceSegmentStore implements BounceSegmentStore {
  inner: BounceSegmentStore;
  cache: cache.TtlCache<BounceSegment>;
  hits: number;
  misses: number;

  constructor(inner: BounceSegmentStore, cacheValue: cache.TtlCache<BounceSegment>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BounceSegment | undefined {
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

  save(item: BounceSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BounceSegment[] {
    return this.inner.list();
  }
}

export function newCachedBounceSegmentStore(inner: BounceSegmentStore, ttl: number, clockValue: clock.Clock): BounceSegmentStore {
  return new CachedBounceSegmentStore(inner, cache.newTtlCache<BounceSegment>(64, ttl, clockValue), 0, 0);
}

/** Selects bounce segments. Empty fields match all. */
export class BounceSegmentQuery {
  name: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BounceSegment): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BounceSegment[]): BounceSegment[] {
    const matched = collections.filter(items, (candidate: BounceSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBounceSegments(store: BounceSegmentStore, query: BounceSegmentQuery): BounceSegment[] {
  return query.apply(store.list());
}
