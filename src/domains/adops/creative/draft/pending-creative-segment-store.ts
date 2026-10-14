import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingCreativeSegment } from "./pending-creative-segment.js";

/** Keeps pending creative segments by code. */
export interface PendingCreativeSegmentStore {
  find(code: string): PendingCreativeSegment | undefined;
  save(item: PendingCreativeSegment): void;
  remove(code: string): boolean;
  list(): PendingCreativeSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingCreativeSegmentStore implements PendingCreativeSegmentStore {
  items: Map<string, PendingCreativeSegment>;
  order: string[];

  constructor(items: Map<string, PendingCreativeSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingCreativeSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingCreativeSegment): void {
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

  list(): PendingCreativeSegment[] {
    const out: PendingCreativeSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingCreativeSegmentStore(): PendingCreativeSegmentStore {
  return new MemoryPendingCreativeSegmentStore(new Map<string, PendingCreativeSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingCreativeSegmentStore implements PendingCreativeSegmentStore {
  inner: PendingCreativeSegmentStore;
  cache: cache.TtlCache<PendingCreativeSegment>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingCreativeSegmentStore,
    cacheValue: cache.TtlCache<PendingCreativeSegment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingCreativeSegment | undefined {
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

  save(item: PendingCreativeSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingCreativeSegment[] {
    return this.inner.list();
  }
}

export function newCachedPendingCreativeSegmentStore(inner: PendingCreativeSegmentStore, ttl: number, clockValue: clock.Clock): PendingCreativeSegmentStore {
  return new CachedPendingCreativeSegmentStore(
    inner,
    cache.newTtlCache<PendingCreativeSegment>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending creative segments. Empty fields match all. */
export class PendingCreativeSegmentQuery {
  title: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minRate: number, statuses: string[], limit: number) {
    this.title = title;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingCreativeSegment): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingCreativeSegment[]): PendingCreativeSegment[] {
    const matched = collections.filter(items, (candidate: PendingCreativeSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingCreativeSegments(store: PendingCreativeSegmentStore, query: PendingCreativeSegmentQuery): PendingCreativeSegment[] {
  return query.apply(store.list());
}
