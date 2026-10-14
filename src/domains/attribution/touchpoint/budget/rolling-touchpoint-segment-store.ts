import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingTouchpointSegment } from "./rolling-touchpoint-segment.js";

/** Keeps rolling touchpoint segments by code. */
export interface RollingTouchpointSegmentStore {
  find(code: string): RollingTouchpointSegment | undefined;
  save(item: RollingTouchpointSegment): void;
  remove(code: string): boolean;
  list(): RollingTouchpointSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingTouchpointSegmentStore implements RollingTouchpointSegmentStore {
  items: Map<string, RollingTouchpointSegment>;
  order: string[];

  constructor(items: Map<string, RollingTouchpointSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingTouchpointSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingTouchpointSegment): void {
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

  list(): RollingTouchpointSegment[] {
    const out: RollingTouchpointSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingTouchpointSegmentStore(): RollingTouchpointSegmentStore {
  return new MemoryRollingTouchpointSegmentStore(new Map<string, RollingTouchpointSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingTouchpointSegmentStore implements RollingTouchpointSegmentStore {
  inner: RollingTouchpointSegmentStore;
  cache: cache.TtlCache<RollingTouchpointSegment>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingTouchpointSegmentStore,
    cacheValue: cache.TtlCache<RollingTouchpointSegment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingTouchpointSegment | undefined {
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

  save(item: RollingTouchpointSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingTouchpointSegment[] {
    return this.inner.list();
  }
}

export function newCachedRollingTouchpointSegmentStore(inner: RollingTouchpointSegmentStore, ttl: number, clockValue: clock.Clock): RollingTouchpointSegmentStore {
  return new CachedRollingTouchpointSegmentStore(
    inner,
    cache.newTtlCache<RollingTouchpointSegment>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling touchpoint segments. Empty fields match all. */
export class RollingTouchpointSegmentQuery {
  country: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minThreshold: number, statuses: string[], limit: number) {
    this.country = country;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingTouchpointSegment): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingTouchpointSegment[]): RollingTouchpointSegment[] {
    const matched = collections.filter(items, (candidate: RollingTouchpointSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingTouchpointSegments(store: RollingTouchpointSegmentStore, query: RollingTouchpointSegmentQuery): RollingTouchpointSegment[] {
  return query.apply(store.list());
}
