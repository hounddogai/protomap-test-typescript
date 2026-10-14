import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientDeflectionSegment } from "./lenient-deflection-segment.js";

/** Keeps lenient deflection segments by code. */
export interface LenientDeflectionSegmentStore {
  find(code: string): LenientDeflectionSegment | undefined;
  save(item: LenientDeflectionSegment): void;
  remove(code: string): boolean;
  list(): LenientDeflectionSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientDeflectionSegmentStore implements LenientDeflectionSegmentStore {
  items: Map<string, LenientDeflectionSegment>;
  order: string[];

  constructor(items: Map<string, LenientDeflectionSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientDeflectionSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientDeflectionSegment): void {
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

  list(): LenientDeflectionSegment[] {
    const out: LenientDeflectionSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientDeflectionSegmentStore(): LenientDeflectionSegmentStore {
  return new MemoryLenientDeflectionSegmentStore(new Map<string, LenientDeflectionSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientDeflectionSegmentStore implements LenientDeflectionSegmentStore {
  inner: LenientDeflectionSegmentStore;
  cache: cache.TtlCache<LenientDeflectionSegment>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientDeflectionSegmentStore,
    cacheValue: cache.TtlCache<LenientDeflectionSegment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientDeflectionSegment | undefined {
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

  save(item: LenientDeflectionSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientDeflectionSegment[] {
    return this.inner.list();
  }
}

export function newCachedLenientDeflectionSegmentStore(inner: LenientDeflectionSegmentStore, ttl: number, clockValue: clock.Clock): LenientDeflectionSegmentStore {
  return new CachedLenientDeflectionSegmentStore(
    inner,
    cache.newTtlCache<LenientDeflectionSegment>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient deflection segments. Empty fields match all. */
export class LenientDeflectionSegmentQuery {
  unit: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minFloorValue: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientDeflectionSegment): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientDeflectionSegment[]): LenientDeflectionSegment[] {
    const matched = collections.filter(items, (candidate: LenientDeflectionSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientDeflectionSegments(store: LenientDeflectionSegmentStore, query: LenientDeflectionSegmentQuery): LenientDeflectionSegment[] {
  return query.apply(store.list());
}
