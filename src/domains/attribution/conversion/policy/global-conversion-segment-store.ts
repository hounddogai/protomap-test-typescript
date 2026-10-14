import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalConversionSegment } from "./global-conversion-segment.js";

/** Keeps global conversion segments by code. */
export interface GlobalConversionSegmentStore {
  find(code: string): GlobalConversionSegment | undefined;
  save(item: GlobalConversionSegment): void;
  remove(code: string): boolean;
  list(): GlobalConversionSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalConversionSegmentStore implements GlobalConversionSegmentStore {
  items: Map<string, GlobalConversionSegment>;
  order: string[];

  constructor(items: Map<string, GlobalConversionSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalConversionSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalConversionSegment): void {
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

  list(): GlobalConversionSegment[] {
    const out: GlobalConversionSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalConversionSegmentStore(): GlobalConversionSegmentStore {
  return new MemoryGlobalConversionSegmentStore(new Map<string, GlobalConversionSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalConversionSegmentStore implements GlobalConversionSegmentStore {
  inner: GlobalConversionSegmentStore;
  cache: cache.TtlCache<GlobalConversionSegment>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalConversionSegmentStore,
    cacheValue: cache.TtlCache<GlobalConversionSegment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalConversionSegment | undefined {
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

  save(item: GlobalConversionSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalConversionSegment[] {
    return this.inner.list();
  }
}

export function newCachedGlobalConversionSegmentStore(inner: GlobalConversionSegmentStore, ttl: number, clockValue: clock.Clock): GlobalConversionSegmentStore {
  return new CachedGlobalConversionSegmentStore(
    inner,
    cache.newTtlCache<GlobalConversionSegment>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects global conversion segments. Empty fields match all. */
export class GlobalConversionSegmentQuery {
  segment: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minClicks: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalConversionSegment): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalConversionSegment[]): GlobalConversionSegment[] {
    const matched = collections.filter(items, (candidate: GlobalConversionSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalConversionSegments(store: GlobalConversionSegmentStore, query: GlobalConversionSegmentQuery): GlobalConversionSegment[] {
  return query.apply(store.list());
}
