import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedPayoutSegment } from "./weighted-payout-segment.js";

/** Keeps weighted payout segments by code. */
export interface WeightedPayoutSegmentStore {
  find(code: string): WeightedPayoutSegment | undefined;
  save(item: WeightedPayoutSegment): void;
  remove(code: string): boolean;
  list(): WeightedPayoutSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedPayoutSegmentStore implements WeightedPayoutSegmentStore {
  items: Map<string, WeightedPayoutSegment>;
  order: string[];

  constructor(items: Map<string, WeightedPayoutSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedPayoutSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedPayoutSegment): void {
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

  list(): WeightedPayoutSegment[] {
    const out: WeightedPayoutSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedPayoutSegmentStore(): WeightedPayoutSegmentStore {
  return new MemoryWeightedPayoutSegmentStore(new Map<string, WeightedPayoutSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedPayoutSegmentStore implements WeightedPayoutSegmentStore {
  inner: WeightedPayoutSegmentStore;
  cache: cache.TtlCache<WeightedPayoutSegment>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedPayoutSegmentStore,
    cacheValue: cache.TtlCache<WeightedPayoutSegment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedPayoutSegment | undefined {
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

  save(item: WeightedPayoutSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedPayoutSegment[] {
    return this.inner.list();
  }
}

export function newCachedWeightedPayoutSegmentStore(inner: WeightedPayoutSegmentStore, ttl: number, clockValue: clock.Clock): WeightedPayoutSegmentStore {
  return new CachedWeightedPayoutSegmentStore(
    inner,
    cache.newTtlCache<WeightedPayoutSegment>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted payout segments. Empty fields match all. */
export class WeightedPayoutSegmentQuery {
  segment: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minGraceDays: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedPayoutSegment): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedPayoutSegment[]): WeightedPayoutSegment[] {
    const matched = collections.filter(items, (candidate: WeightedPayoutSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedPayoutSegments(store: WeightedPayoutSegmentStore, query: WeightedPayoutSegmentQuery): WeightedPayoutSegment[] {
  return query.apply(store.list());
}
