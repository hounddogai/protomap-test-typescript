import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalSuppressionSegment } from "./seasonal-suppression-segment.js";

/** Keeps seasonal suppression segments by code. */
export interface SeasonalSuppressionSegmentStore {
  find(code: string): SeasonalSuppressionSegment | undefined;
  save(item: SeasonalSuppressionSegment): void;
  remove(code: string): boolean;
  list(): SeasonalSuppressionSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalSuppressionSegmentStore implements SeasonalSuppressionSegmentStore {
  items: Map<string, SeasonalSuppressionSegment>;
  order: string[];

  constructor(items: Map<string, SeasonalSuppressionSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalSuppressionSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalSuppressionSegment): void {
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

  list(): SeasonalSuppressionSegment[] {
    const out: SeasonalSuppressionSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalSuppressionSegmentStore(): SeasonalSuppressionSegmentStore {
  return new MemorySeasonalSuppressionSegmentStore(new Map<string, SeasonalSuppressionSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalSuppressionSegmentStore implements SeasonalSuppressionSegmentStore {
  inner: SeasonalSuppressionSegmentStore;
  cache: cache.TtlCache<SeasonalSuppressionSegment>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalSuppressionSegmentStore,
    cacheValue: cache.TtlCache<SeasonalSuppressionSegment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalSuppressionSegment | undefined {
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

  save(item: SeasonalSuppressionSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalSuppressionSegment[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalSuppressionSegmentStore(inner: SeasonalSuppressionSegmentStore, ttl: number, clockValue: clock.Clock): SeasonalSuppressionSegmentStore {
  return new CachedSeasonalSuppressionSegmentStore(
    inner,
    cache.newTtlCache<SeasonalSuppressionSegment>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal suppression segments. Empty fields match all. */
export class SeasonalSuppressionSegmentQuery {
  title: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minMargin: number, statuses: string[], limit: number) {
    this.title = title;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalSuppressionSegment): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalSuppressionSegment[]): SeasonalSuppressionSegment[] {
    const matched = collections.filter(items, (candidate: SeasonalSuppressionSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalSuppressionSegments(store: SeasonalSuppressionSegmentStore, query: SeasonalSuppressionSegmentQuery): SeasonalSuppressionSegment[] {
  return query.apply(store.list());
}
