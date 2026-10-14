import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { InsightSegment } from "./insight-segment.js";

/** Keeps insight segments by code. */
export interface InsightSegmentStore {
  find(code: string): InsightSegment | undefined;
  save(item: InsightSegment): void;
  remove(code: string): boolean;
  list(): InsightSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryInsightSegmentStore implements InsightSegmentStore {
  items: Map<string, InsightSegment>;
  order: string[];

  constructor(items: Map<string, InsightSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): InsightSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: InsightSegment): void {
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

  list(): InsightSegment[] {
    const out: InsightSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryInsightSegmentStore(): InsightSegmentStore {
  return new MemoryInsightSegmentStore(new Map<string, InsightSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedInsightSegmentStore implements InsightSegmentStore {
  inner: InsightSegmentStore;
  cache: cache.TtlCache<InsightSegment>;
  hits: number;
  misses: number;

  constructor(
    inner: InsightSegmentStore,
    cacheValue: cache.TtlCache<InsightSegment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): InsightSegment | undefined {
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

  save(item: InsightSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): InsightSegment[] {
    return this.inner.list();
  }
}

export function newCachedInsightSegmentStore(inner: InsightSegmentStore, ttl: number, clockValue: clock.Clock): InsightSegmentStore {
  return new CachedInsightSegmentStore(inner, cache.newTtlCache<InsightSegment>(512, ttl, clockValue), 0, 0);
}

/** Selects insight segments. Empty fields match all. */
export class InsightSegmentQuery {
  region: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minCeiling: number, statuses: string[], limit: number) {
    this.region = region;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: InsightSegment): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: InsightSegment[]): InsightSegment[] {
    const matched = collections.filter(items, (candidate: InsightSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findInsightSegments(store: InsightSegmentStore, query: InsightSegmentQuery): InsightSegment[] {
  return query.apply(store.list());
}
