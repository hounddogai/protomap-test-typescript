import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedActivationSegment } from "./weighted-activation-segment.js";

/** Keeps weighted activation segments by code. */
export interface WeightedActivationSegmentStore {
  find(code: string): WeightedActivationSegment | undefined;
  save(item: WeightedActivationSegment): void;
  remove(code: string): boolean;
  list(): WeightedActivationSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedActivationSegmentStore implements WeightedActivationSegmentStore {
  items: Map<string, WeightedActivationSegment>;
  order: string[];

  constructor(items: Map<string, WeightedActivationSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedActivationSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedActivationSegment): void {
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

  list(): WeightedActivationSegment[] {
    const out: WeightedActivationSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedActivationSegmentStore(): WeightedActivationSegmentStore {
  return new MemoryWeightedActivationSegmentStore(new Map<string, WeightedActivationSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedActivationSegmentStore implements WeightedActivationSegmentStore {
  inner: WeightedActivationSegmentStore;
  cache: cache.TtlCache<WeightedActivationSegment>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedActivationSegmentStore,
    cacheValue: cache.TtlCache<WeightedActivationSegment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedActivationSegment | undefined {
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

  save(item: WeightedActivationSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedActivationSegment[] {
    return this.inner.list();
  }
}

export function newCachedWeightedActivationSegmentStore(inner: WeightedActivationSegmentStore, ttl: number, clockValue: clock.Clock): WeightedActivationSegmentStore {
  return new CachedWeightedActivationSegmentStore(
    inner,
    cache.newTtlCache<WeightedActivationSegment>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted activation segments. Empty fields match all. */
export class WeightedActivationSegmentQuery {
  channel: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minCeiling: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedActivationSegment): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedActivationSegment[]): WeightedActivationSegment[] {
    const matched = collections.filter(items, (candidate: WeightedActivationSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedActivationSegments(store: WeightedActivationSegmentStore, query: WeightedActivationSegmentQuery): WeightedActivationSegment[] {
  return query.apply(store.list());
}
