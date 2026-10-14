import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RetentionSegment } from "./retention-segment.js";

/** Keeps retention segments by code. */
export interface RetentionSegmentStore {
  find(code: string): RetentionSegment | undefined;
  save(item: RetentionSegment): void;
  remove(code: string): boolean;
  list(): RetentionSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRetentionSegmentStore implements RetentionSegmentStore {
  items: Map<string, RetentionSegment>;
  order: string[];

  constructor(items: Map<string, RetentionSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RetentionSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RetentionSegment): void {
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

  list(): RetentionSegment[] {
    const out: RetentionSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRetentionSegmentStore(): RetentionSegmentStore {
  return new MemoryRetentionSegmentStore(new Map<string, RetentionSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRetentionSegmentStore implements RetentionSegmentStore {
  inner: RetentionSegmentStore;
  cache: cache.TtlCache<RetentionSegment>;
  hits: number;
  misses: number;

  constructor(
    inner: RetentionSegmentStore,
    cacheValue: cache.TtlCache<RetentionSegment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RetentionSegment | undefined {
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

  save(item: RetentionSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RetentionSegment[] {
    return this.inner.list();
  }
}

export function newCachedRetentionSegmentStore(inner: RetentionSegmentStore, ttl: number, clockValue: clock.Clock): RetentionSegmentStore {
  return new CachedRetentionSegmentStore(inner, cache.newTtlCache<RetentionSegment>(256, ttl, clockValue), 0, 0);
}

/** Selects retention segments. Empty fields match all. */
export class RetentionSegmentQuery {
  name: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minVersion: number, statuses: string[], limit: number) {
    this.name = name;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RetentionSegment): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RetentionSegment[]): RetentionSegment[] {
    const matched = collections.filter(items, (candidate: RetentionSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRetentionSegments(store: RetentionSegmentStore, query: RetentionSegmentQuery): RetentionSegment[] {
  return query.apply(store.list());
}
