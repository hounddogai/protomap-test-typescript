import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PlacementSegment } from "./placement-segment.js";

/** Keeps placement segments by code. */
export interface PlacementSegmentStore {
  find(code: string): PlacementSegment | undefined;
  save(item: PlacementSegment): void;
  remove(code: string): boolean;
  list(): PlacementSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPlacementSegmentStore implements PlacementSegmentStore {
  items: Map<string, PlacementSegment>;
  order: string[];

  constructor(items: Map<string, PlacementSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PlacementSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PlacementSegment): void {
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

  list(): PlacementSegment[] {
    const out: PlacementSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPlacementSegmentStore(): PlacementSegmentStore {
  return new MemoryPlacementSegmentStore(new Map<string, PlacementSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPlacementSegmentStore implements PlacementSegmentStore {
  inner: PlacementSegmentStore;
  cache: cache.TtlCache<PlacementSegment>;
  hits: number;
  misses: number;

  constructor(
    inner: PlacementSegmentStore,
    cacheValue: cache.TtlCache<PlacementSegment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PlacementSegment | undefined {
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

  save(item: PlacementSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PlacementSegment[] {
    return this.inner.list();
  }
}

export function newCachedPlacementSegmentStore(inner: PlacementSegmentStore, ttl: number, clockValue: clock.Clock): PlacementSegmentStore {
  return new CachedPlacementSegmentStore(inner, cache.newTtlCache<PlacementSegment>(128, ttl, clockValue), 0, 0);
}

/** Selects placement segments. Empty fields match all. */
export class PlacementSegmentQuery {
  unit: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PlacementSegment): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PlacementSegment[]): PlacementSegment[] {
    const matched = collections.filter(items, (candidate: PlacementSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPlacementSegments(store: PlacementSegmentStore, query: PlacementSegmentQuery): PlacementSegment[] {
  return query.apply(store.list());
}
