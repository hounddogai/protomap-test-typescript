import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalSubscriptionSegment } from "./seasonal-subscription-segment.js";

/** Keeps seasonal subscription segments by code. */
export interface SeasonalSubscriptionSegmentStore {
  find(code: string): SeasonalSubscriptionSegment | undefined;
  save(item: SeasonalSubscriptionSegment): void;
  remove(code: string): boolean;
  list(): SeasonalSubscriptionSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalSubscriptionSegmentStore implements SeasonalSubscriptionSegmentStore {
  items: Map<string, SeasonalSubscriptionSegment>;
  order: string[];

  constructor(items: Map<string, SeasonalSubscriptionSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalSubscriptionSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalSubscriptionSegment): void {
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

  list(): SeasonalSubscriptionSegment[] {
    const out: SeasonalSubscriptionSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalSubscriptionSegmentStore(): SeasonalSubscriptionSegmentStore {
  return new MemorySeasonalSubscriptionSegmentStore(new Map<string, SeasonalSubscriptionSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalSubscriptionSegmentStore implements SeasonalSubscriptionSegmentStore {
  inner: SeasonalSubscriptionSegmentStore;
  cache: cache.TtlCache<SeasonalSubscriptionSegment>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalSubscriptionSegmentStore,
    cacheValue: cache.TtlCache<SeasonalSubscriptionSegment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalSubscriptionSegment | undefined {
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

  save(item: SeasonalSubscriptionSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalSubscriptionSegment[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalSubscriptionSegmentStore(inner: SeasonalSubscriptionSegmentStore, ttl: number, clockValue: clock.Clock): SeasonalSubscriptionSegmentStore {
  return new CachedSeasonalSubscriptionSegmentStore(
    inner,
    cache.newTtlCache<SeasonalSubscriptionSegment>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal subscription segments. Empty fields match all. */
export class SeasonalSubscriptionSegmentQuery {
  source: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.source = source;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalSubscriptionSegment): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalSubscriptionSegment[]): SeasonalSubscriptionSegment[] {
    const matched = collections.filter(items, (candidate: SeasonalSubscriptionSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalSubscriptionSegments(store: SeasonalSubscriptionSegmentStore, query: SeasonalSubscriptionSegmentQuery): SeasonalSubscriptionSegment[] {
  return query.apply(store.list());
}
