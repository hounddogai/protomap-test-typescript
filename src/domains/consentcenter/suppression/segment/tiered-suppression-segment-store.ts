import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredSuppressionSegment } from "./tiered-suppression-segment.js";

/** Keeps tiered suppression segments by code. */
export interface TieredSuppressionSegmentStore {
  find(code: string): TieredSuppressionSegment | undefined;
  save(item: TieredSuppressionSegment): void;
  remove(code: string): boolean;
  list(): TieredSuppressionSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredSuppressionSegmentStore implements TieredSuppressionSegmentStore {
  items: Map<string, TieredSuppressionSegment>;
  order: string[];

  constructor(items: Map<string, TieredSuppressionSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredSuppressionSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredSuppressionSegment): void {
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

  list(): TieredSuppressionSegment[] {
    const out: TieredSuppressionSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredSuppressionSegmentStore(): TieredSuppressionSegmentStore {
  return new MemoryTieredSuppressionSegmentStore(new Map<string, TieredSuppressionSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredSuppressionSegmentStore implements TieredSuppressionSegmentStore {
  inner: TieredSuppressionSegmentStore;
  cache: cache.TtlCache<TieredSuppressionSegment>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredSuppressionSegmentStore,
    cacheValue: cache.TtlCache<TieredSuppressionSegment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredSuppressionSegment | undefined {
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

  save(item: TieredSuppressionSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredSuppressionSegment[] {
    return this.inner.list();
  }
}

export function newCachedTieredSuppressionSegmentStore(inner: TieredSuppressionSegmentStore, ttl: number, clockValue: clock.Clock): TieredSuppressionSegmentStore {
  return new CachedTieredSuppressionSegmentStore(
    inner,
    cache.newTtlCache<TieredSuppressionSegment>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered suppression segments. Empty fields match all. */
export class TieredSuppressionSegmentQuery {
  channel: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minConversionRate: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredSuppressionSegment): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredSuppressionSegment[]): TieredSuppressionSegment[] {
    const matched = collections.filter(items, (candidate: TieredSuppressionSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredSuppressionSegments(store: TieredSuppressionSegmentStore, query: TieredSuppressionSegmentQuery): TieredSuppressionSegment[] {
  return query.apply(store.list());
}
