import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientLeaderboardSegment } from "./lenient-leaderboard-segment.js";

/** Keeps lenient leaderboard segments by code. */
export interface LenientLeaderboardSegmentStore {
  find(code: string): LenientLeaderboardSegment | undefined;
  save(item: LenientLeaderboardSegment): void;
  remove(code: string): boolean;
  list(): LenientLeaderboardSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientLeaderboardSegmentStore implements LenientLeaderboardSegmentStore {
  items: Map<string, LenientLeaderboardSegment>;
  order: string[];

  constructor(items: Map<string, LenientLeaderboardSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientLeaderboardSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientLeaderboardSegment): void {
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

  list(): LenientLeaderboardSegment[] {
    const out: LenientLeaderboardSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientLeaderboardSegmentStore(): LenientLeaderboardSegmentStore {
  return new MemoryLenientLeaderboardSegmentStore(new Map<string, LenientLeaderboardSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientLeaderboardSegmentStore implements LenientLeaderboardSegmentStore {
  inner: LenientLeaderboardSegmentStore;
  cache: cache.TtlCache<LenientLeaderboardSegment>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientLeaderboardSegmentStore,
    cacheValue: cache.TtlCache<LenientLeaderboardSegment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientLeaderboardSegment | undefined {
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

  save(item: LenientLeaderboardSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientLeaderboardSegment[] {
    return this.inner.list();
  }
}

export function newCachedLenientLeaderboardSegmentStore(inner: LenientLeaderboardSegmentStore, ttl: number, clockValue: clock.Clock): LenientLeaderboardSegmentStore {
  return new CachedLenientLeaderboardSegmentStore(
    inner,
    cache.newTtlCache<LenientLeaderboardSegment>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient leaderboard segments. Empty fields match all. */
export class LenientLeaderboardSegmentQuery {
  utmSource: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientLeaderboardSegment): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientLeaderboardSegment[]): LenientLeaderboardSegment[] {
    const matched = collections.filter(items, (candidate: LenientLeaderboardSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientLeaderboardSegments(store: LenientLeaderboardSegmentStore, query: LenientLeaderboardSegmentQuery): LenientLeaderboardSegment[] {
  return query.apply(store.list());
}
