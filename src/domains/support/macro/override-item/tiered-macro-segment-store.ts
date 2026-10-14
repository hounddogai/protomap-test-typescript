import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredMacroSegment } from "./tiered-macro-segment.js";

/** Keeps tiered macro segments by code. */
export interface TieredMacroSegmentStore {
  find(code: string): TieredMacroSegment | undefined;
  save(item: TieredMacroSegment): void;
  remove(code: string): boolean;
  list(): TieredMacroSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredMacroSegmentStore implements TieredMacroSegmentStore {
  items: Map<string, TieredMacroSegment>;
  order: string[];

  constructor(items: Map<string, TieredMacroSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredMacroSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredMacroSegment): void {
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

  list(): TieredMacroSegment[] {
    const out: TieredMacroSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredMacroSegmentStore(): TieredMacroSegmentStore {
  return new MemoryTieredMacroSegmentStore(new Map<string, TieredMacroSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredMacroSegmentStore implements TieredMacroSegmentStore {
  inner: TieredMacroSegmentStore;
  cache: cache.TtlCache<TieredMacroSegment>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredMacroSegmentStore,
    cacheValue: cache.TtlCache<TieredMacroSegment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredMacroSegment | undefined {
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

  save(item: TieredMacroSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredMacroSegment[] {
    return this.inner.list();
  }
}

export function newCachedTieredMacroSegmentStore(inner: TieredMacroSegmentStore, ttl: number, clockValue: clock.Clock): TieredMacroSegmentStore {
  return new CachedTieredMacroSegmentStore(inner, cache.newTtlCache<TieredMacroSegment>(64, ttl, clockValue), 0, 0);
}

/** Selects tiered macro segments. Empty fields match all. */
export class TieredMacroSegmentQuery {
  unit: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minClicks: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredMacroSegment): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredMacroSegment[]): TieredMacroSegment[] {
    const matched = collections.filter(items, (candidate: TieredMacroSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredMacroSegments(store: TieredMacroSegmentStore, query: TieredMacroSegmentQuery): TieredMacroSegment[] {
  return query.apply(store.list());
}
