import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalDoubleOptInSegment } from "./seasonal-double-opt-in-segment.js";

/** Keeps seasonal double opt in segments by code. */
export interface SeasonalDoubleOptInSegmentStore {
  find(code: string): SeasonalDoubleOptInSegment | undefined;
  save(item: SeasonalDoubleOptInSegment): void;
  remove(code: string): boolean;
  list(): SeasonalDoubleOptInSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalDoubleOptInSegmentStore implements SeasonalDoubleOptInSegmentStore {
  items: Map<string, SeasonalDoubleOptInSegment>;
  order: string[];

  constructor(items: Map<string, SeasonalDoubleOptInSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalDoubleOptInSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalDoubleOptInSegment): void {
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

  list(): SeasonalDoubleOptInSegment[] {
    const out: SeasonalDoubleOptInSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalDoubleOptInSegmentStore(): SeasonalDoubleOptInSegmentStore {
  return new MemorySeasonalDoubleOptInSegmentStore(new Map<string, SeasonalDoubleOptInSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalDoubleOptInSegmentStore implements SeasonalDoubleOptInSegmentStore {
  inner: SeasonalDoubleOptInSegmentStore;
  cache: cache.TtlCache<SeasonalDoubleOptInSegment>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalDoubleOptInSegmentStore,
    cacheValue: cache.TtlCache<SeasonalDoubleOptInSegment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalDoubleOptInSegment | undefined {
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

  save(item: SeasonalDoubleOptInSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalDoubleOptInSegment[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalDoubleOptInSegmentStore(inner: SeasonalDoubleOptInSegmentStore, ttl: number, clockValue: clock.Clock): SeasonalDoubleOptInSegmentStore {
  return new CachedSeasonalDoubleOptInSegmentStore(
    inner,
    cache.newTtlCache<SeasonalDoubleOptInSegment>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal double opt in segments. Empty fields match all. */
export class SeasonalDoubleOptInSegmentQuery {
  label: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minBid: number, statuses: string[], limit: number) {
    this.label = label;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalDoubleOptInSegment): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalDoubleOptInSegment[]): SeasonalDoubleOptInSegment[] {
    const matched = collections.filter(items, (candidate: SeasonalDoubleOptInSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalDoubleOptInSegments(store: SeasonalDoubleOptInSegmentStore, query: SeasonalDoubleOptInSegmentQuery): SeasonalDoubleOptInSegment[] {
  return query.apply(store.list());
}
