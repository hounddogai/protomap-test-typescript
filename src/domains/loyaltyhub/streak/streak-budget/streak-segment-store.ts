import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StreakSegment } from "./streak-segment.js";

/** Keeps streak segments by code. */
export interface StreakSegmentStore {
  find(code: string): StreakSegment | undefined;
  save(item: StreakSegment): void;
  remove(code: string): boolean;
  list(): StreakSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStreakSegmentStore implements StreakSegmentStore {
  items: Map<string, StreakSegment>;
  order: string[];

  constructor(items: Map<string, StreakSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StreakSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StreakSegment): void {
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

  list(): StreakSegment[] {
    const out: StreakSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStreakSegmentStore(): StreakSegmentStore {
  return new MemoryStreakSegmentStore(new Map<string, StreakSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStreakSegmentStore implements StreakSegmentStore {
  inner: StreakSegmentStore;
  cache: cache.TtlCache<StreakSegment>;
  hits: number;
  misses: number;

  constructor(inner: StreakSegmentStore, cacheValue: cache.TtlCache<StreakSegment>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StreakSegment | undefined {
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

  save(item: StreakSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StreakSegment[] {
    return this.inner.list();
  }
}

export function newCachedStreakSegmentStore(inner: StreakSegmentStore, ttl: number, clockValue: clock.Clock): StreakSegmentStore {
  return new CachedStreakSegmentStore(inner, cache.newTtlCache<StreakSegment>(512, ttl, clockValue), 0, 0);
}

/** Selects streak segments. Empty fields match all. */
export class StreakSegmentQuery {
  segment: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minRate: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StreakSegment): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StreakSegment[]): StreakSegment[] {
    const matched = collections.filter(items, (candidate: StreakSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStreakSegments(store: StreakSegmentStore, query: StreakSegmentQuery): StreakSegment[] {
  return query.apply(store.list());
}
