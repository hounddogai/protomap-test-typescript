import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveLevelSegment } from "./adaptive-level-segment.js";

/** Keeps adaptive level segments by code. */
export interface AdaptiveLevelSegmentStore {
  find(code: string): AdaptiveLevelSegment | undefined;
  save(item: AdaptiveLevelSegment): void;
  remove(code: string): boolean;
  list(): AdaptiveLevelSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveLevelSegmentStore implements AdaptiveLevelSegmentStore {
  items: Map<string, AdaptiveLevelSegment>;
  order: string[];

  constructor(items: Map<string, AdaptiveLevelSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveLevelSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveLevelSegment): void {
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

  list(): AdaptiveLevelSegment[] {
    const out: AdaptiveLevelSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveLevelSegmentStore(): AdaptiveLevelSegmentStore {
  return new MemoryAdaptiveLevelSegmentStore(new Map<string, AdaptiveLevelSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveLevelSegmentStore implements AdaptiveLevelSegmentStore {
  inner: AdaptiveLevelSegmentStore;
  cache: cache.TtlCache<AdaptiveLevelSegment>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveLevelSegmentStore,
    cacheValue: cache.TtlCache<AdaptiveLevelSegment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveLevelSegment | undefined {
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

  save(item: AdaptiveLevelSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveLevelSegment[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveLevelSegmentStore(inner: AdaptiveLevelSegmentStore, ttl: number, clockValue: clock.Clock): AdaptiveLevelSegmentStore {
  return new CachedAdaptiveLevelSegmentStore(
    inner,
    cache.newTtlCache<AdaptiveLevelSegment>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive level segments. Empty fields match all. */
export class AdaptiveLevelSegmentQuery {
  channel: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveLevelSegment): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveLevelSegment[]): AdaptiveLevelSegment[] {
    const matched = collections.filter(items, (candidate: AdaptiveLevelSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveLevelSegments(store: AdaptiveLevelSegmentStore, query: AdaptiveLevelSegmentQuery): AdaptiveLevelSegment[] {
  return query.apply(store.list());
}
