import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimarySenderSegment } from "./primary-sender-segment.js";

/** Keeps primary sender segments by code. */
export interface PrimarySenderSegmentStore {
  find(code: string): PrimarySenderSegment | undefined;
  save(item: PrimarySenderSegment): void;
  remove(code: string): boolean;
  list(): PrimarySenderSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimarySenderSegmentStore implements PrimarySenderSegmentStore {
  items: Map<string, PrimarySenderSegment>;
  order: string[];

  constructor(items: Map<string, PrimarySenderSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimarySenderSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimarySenderSegment): void {
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

  list(): PrimarySenderSegment[] {
    const out: PrimarySenderSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimarySenderSegmentStore(): PrimarySenderSegmentStore {
  return new MemoryPrimarySenderSegmentStore(new Map<string, PrimarySenderSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimarySenderSegmentStore implements PrimarySenderSegmentStore {
  inner: PrimarySenderSegmentStore;
  cache: cache.TtlCache<PrimarySenderSegment>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimarySenderSegmentStore,
    cacheValue: cache.TtlCache<PrimarySenderSegment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimarySenderSegment | undefined {
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

  save(item: PrimarySenderSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimarySenderSegment[] {
    return this.inner.list();
  }
}

export function newCachedPrimarySenderSegmentStore(inner: PrimarySenderSegmentStore, ttl: number, clockValue: clock.Clock): PrimarySenderSegmentStore {
  return new CachedPrimarySenderSegmentStore(
    inner,
    cache.newTtlCache<PrimarySenderSegment>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary sender segments. Empty fields match all. */
export class PrimarySenderSegmentQuery {
  utmSource: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minWindowDays: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimarySenderSegment): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimarySenderSegment[]): PrimarySenderSegment[] {
    const matched = collections.filter(items, (candidate: PrimarySenderSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimarySenderSegments(store: PrimarySenderSegmentStore, query: PrimarySenderSegmentQuery): PrimarySenderSegment[] {
  return query.apply(store.list());
}
