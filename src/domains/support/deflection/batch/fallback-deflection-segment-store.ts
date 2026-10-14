import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackDeflectionSegment } from "./fallback-deflection-segment.js";

/** Keeps fallback deflection segments by code. */
export interface FallbackDeflectionSegmentStore {
  find(code: string): FallbackDeflectionSegment | undefined;
  save(item: FallbackDeflectionSegment): void;
  remove(code: string): boolean;
  list(): FallbackDeflectionSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackDeflectionSegmentStore implements FallbackDeflectionSegmentStore {
  items: Map<string, FallbackDeflectionSegment>;
  order: string[];

  constructor(items: Map<string, FallbackDeflectionSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackDeflectionSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackDeflectionSegment): void {
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

  list(): FallbackDeflectionSegment[] {
    const out: FallbackDeflectionSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackDeflectionSegmentStore(): FallbackDeflectionSegmentStore {
  return new MemoryFallbackDeflectionSegmentStore(new Map<string, FallbackDeflectionSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackDeflectionSegmentStore implements FallbackDeflectionSegmentStore {
  inner: FallbackDeflectionSegmentStore;
  cache: cache.TtlCache<FallbackDeflectionSegment>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackDeflectionSegmentStore,
    cacheValue: cache.TtlCache<FallbackDeflectionSegment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackDeflectionSegment | undefined {
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

  save(item: FallbackDeflectionSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackDeflectionSegment[] {
    return this.inner.list();
  }
}

export function newCachedFallbackDeflectionSegmentStore(inner: FallbackDeflectionSegmentStore, ttl: number, clockValue: clock.Clock): FallbackDeflectionSegmentStore {
  return new CachedFallbackDeflectionSegmentStore(
    inner,
    cache.newTtlCache<FallbackDeflectionSegment>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback deflection segments. Empty fields match all. */
export class FallbackDeflectionSegmentQuery {
  name: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.name = name;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackDeflectionSegment): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackDeflectionSegment[]): FallbackDeflectionSegment[] {
    const matched = collections.filter(items, (candidate: FallbackDeflectionSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackDeflectionSegments(store: FallbackDeflectionSegmentStore, query: FallbackDeflectionSegmentQuery): FallbackDeflectionSegment[] {
  return query.apply(store.list());
}
