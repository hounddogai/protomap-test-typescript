import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveLeaderboardSegment } from "./adaptive-leaderboard-segment.js";

/** Keeps adaptive leaderboard segments by code. */
export interface AdaptiveLeaderboardSegmentStore {
  find(code: string): AdaptiveLeaderboardSegment | undefined;
  save(item: AdaptiveLeaderboardSegment): void;
  remove(code: string): boolean;
  list(): AdaptiveLeaderboardSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveLeaderboardSegmentStore implements AdaptiveLeaderboardSegmentStore {
  items: Map<string, AdaptiveLeaderboardSegment>;
  order: string[];

  constructor(items: Map<string, AdaptiveLeaderboardSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveLeaderboardSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveLeaderboardSegment): void {
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

  list(): AdaptiveLeaderboardSegment[] {
    const out: AdaptiveLeaderboardSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveLeaderboardSegmentStore(): AdaptiveLeaderboardSegmentStore {
  return new MemoryAdaptiveLeaderboardSegmentStore(new Map<string, AdaptiveLeaderboardSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveLeaderboardSegmentStore implements AdaptiveLeaderboardSegmentStore {
  inner: AdaptiveLeaderboardSegmentStore;
  cache: cache.TtlCache<AdaptiveLeaderboardSegment>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveLeaderboardSegmentStore,
    cacheValue: cache.TtlCache<AdaptiveLeaderboardSegment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveLeaderboardSegment | undefined {
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

  save(item: AdaptiveLeaderboardSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveLeaderboardSegment[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveLeaderboardSegmentStore(inner: AdaptiveLeaderboardSegmentStore, ttl: number, clockValue: clock.Clock): AdaptiveLeaderboardSegmentStore {
  return new CachedAdaptiveLeaderboardSegmentStore(
    inner,
    cache.newTtlCache<AdaptiveLeaderboardSegment>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive leaderboard segments. Empty fields match all. */
export class AdaptiveLeaderboardSegmentQuery {
  unit: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minAmount: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveLeaderboardSegment): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveLeaderboardSegment[]): AdaptiveLeaderboardSegment[] {
    const matched = collections.filter(items, (candidate: AdaptiveLeaderboardSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveLeaderboardSegments(store: AdaptiveLeaderboardSegmentStore, query: AdaptiveLeaderboardSegmentQuery): AdaptiveLeaderboardSegment[] {
  return query.apply(store.list());
}
