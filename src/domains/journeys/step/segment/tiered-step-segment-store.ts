import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredStepSegment } from "./tiered-step-segment.js";

/** Keeps tiered step segments by code. */
export interface TieredStepSegmentStore {
  find(code: string): TieredStepSegment | undefined;
  save(item: TieredStepSegment): void;
  remove(code: string): boolean;
  list(): TieredStepSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredStepSegmentStore implements TieredStepSegmentStore {
  items: Map<string, TieredStepSegment>;
  order: string[];

  constructor(items: Map<string, TieredStepSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredStepSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredStepSegment): void {
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

  list(): TieredStepSegment[] {
    const out: TieredStepSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredStepSegmentStore(): TieredStepSegmentStore {
  return new MemoryTieredStepSegmentStore(new Map<string, TieredStepSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredStepSegmentStore implements TieredStepSegmentStore {
  inner: TieredStepSegmentStore;
  cache: cache.TtlCache<TieredStepSegment>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredStepSegmentStore,
    cacheValue: cache.TtlCache<TieredStepSegment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredStepSegment | undefined {
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

  save(item: TieredStepSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredStepSegment[] {
    return this.inner.list();
  }
}

export function newCachedTieredStepSegmentStore(inner: TieredStepSegmentStore, ttl: number, clockValue: clock.Clock): TieredStepSegmentStore {
  return new CachedTieredStepSegmentStore(inner, cache.newTtlCache<TieredStepSegment>(1024, ttl, clockValue), 0, 0);
}

/** Selects tiered step segments. Empty fields match all. */
export class TieredStepSegmentQuery {
  country: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.country = country;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredStepSegment): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredStepSegment[]): TieredStepSegment[] {
    const matched = collections.filter(items, (candidate: TieredStepSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredStepSegments(store: TieredStepSegmentStore, query: TieredStepSegmentQuery): TieredStepSegment[] {
  return query.apply(store.list());
}
