import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientFunnelSegment } from "./lenient-funnel-segment.js";

/** Keeps lenient funnel segments by code. */
export interface LenientFunnelSegmentStore {
  find(code: string): LenientFunnelSegment | undefined;
  save(item: LenientFunnelSegment): void;
  remove(code: string): boolean;
  list(): LenientFunnelSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientFunnelSegmentStore implements LenientFunnelSegmentStore {
  items: Map<string, LenientFunnelSegment>;
  order: string[];

  constructor(items: Map<string, LenientFunnelSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientFunnelSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientFunnelSegment): void {
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

  list(): LenientFunnelSegment[] {
    const out: LenientFunnelSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientFunnelSegmentStore(): LenientFunnelSegmentStore {
  return new MemoryLenientFunnelSegmentStore(new Map<string, LenientFunnelSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientFunnelSegmentStore implements LenientFunnelSegmentStore {
  inner: LenientFunnelSegmentStore;
  cache: cache.TtlCache<LenientFunnelSegment>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientFunnelSegmentStore,
    cacheValue: cache.TtlCache<LenientFunnelSegment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientFunnelSegment | undefined {
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

  save(item: LenientFunnelSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientFunnelSegment[] {
    return this.inner.list();
  }
}

export function newCachedLenientFunnelSegmentStore(inner: LenientFunnelSegmentStore, ttl: number, clockValue: clock.Clock): LenientFunnelSegmentStore {
  return new CachedLenientFunnelSegmentStore(inner, cache.newTtlCache<LenientFunnelSegment>(64, ttl, clockValue), 0, 0);
}

/** Selects lenient funnel segments. Empty fields match all. */
export class LenientFunnelSegmentQuery {
  segment: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minBatchSize: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientFunnelSegment): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientFunnelSegment[]): LenientFunnelSegment[] {
    const matched = collections.filter(items, (candidate: LenientFunnelSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientFunnelSegments(store: LenientFunnelSegmentStore, query: LenientFunnelSegmentQuery): LenientFunnelSegment[] {
  return query.apply(store.list());
}
