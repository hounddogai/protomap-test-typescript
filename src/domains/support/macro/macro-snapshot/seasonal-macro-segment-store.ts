import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalMacroSegment } from "./seasonal-macro-segment.js";

/** Keeps seasonal macro segments by code. */
export interface SeasonalMacroSegmentStore {
  find(code: string): SeasonalMacroSegment | undefined;
  save(item: SeasonalMacroSegment): void;
  remove(code: string): boolean;
  list(): SeasonalMacroSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalMacroSegmentStore implements SeasonalMacroSegmentStore {
  items: Map<string, SeasonalMacroSegment>;
  order: string[];

  constructor(items: Map<string, SeasonalMacroSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalMacroSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalMacroSegment): void {
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

  list(): SeasonalMacroSegment[] {
    const out: SeasonalMacroSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalMacroSegmentStore(): SeasonalMacroSegmentStore {
  return new MemorySeasonalMacroSegmentStore(new Map<string, SeasonalMacroSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalMacroSegmentStore implements SeasonalMacroSegmentStore {
  inner: SeasonalMacroSegmentStore;
  cache: cache.TtlCache<SeasonalMacroSegment>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalMacroSegmentStore,
    cacheValue: cache.TtlCache<SeasonalMacroSegment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalMacroSegment | undefined {
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

  save(item: SeasonalMacroSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalMacroSegment[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalMacroSegmentStore(inner: SeasonalMacroSegmentStore, ttl: number, clockValue: clock.Clock): SeasonalMacroSegmentStore {
  return new CachedSeasonalMacroSegmentStore(inner, cache.newTtlCache<SeasonalMacroSegment>(64, ttl, clockValue), 0, 0);
}

/** Selects seasonal macro segments. Empty fields match all. */
export class SeasonalMacroSegmentQuery {
  source: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minRate: number, statuses: string[], limit: number) {
    this.source = source;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalMacroSegment): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalMacroSegment[]): SeasonalMacroSegment[] {
    const matched = collections.filter(items, (candidate: SeasonalMacroSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalMacroSegments(store: SeasonalMacroSegmentStore, query: SeasonalMacroSegmentQuery): SeasonalMacroSegment[] {
  return query.apply(store.list());
}
