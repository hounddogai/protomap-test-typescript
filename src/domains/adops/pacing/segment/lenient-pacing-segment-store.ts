import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientPacingSegment } from "./lenient-pacing-segment.js";

/** Keeps lenient pacing segments by code. */
export interface LenientPacingSegmentStore {
  find(code: string): LenientPacingSegment | undefined;
  save(item: LenientPacingSegment): void;
  remove(code: string): boolean;
  list(): LenientPacingSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientPacingSegmentStore implements LenientPacingSegmentStore {
  items: Map<string, LenientPacingSegment>;
  order: string[];

  constructor(items: Map<string, LenientPacingSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientPacingSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientPacingSegment): void {
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

  list(): LenientPacingSegment[] {
    const out: LenientPacingSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientPacingSegmentStore(): LenientPacingSegmentStore {
  return new MemoryLenientPacingSegmentStore(new Map<string, LenientPacingSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientPacingSegmentStore implements LenientPacingSegmentStore {
  inner: LenientPacingSegmentStore;
  cache: cache.TtlCache<LenientPacingSegment>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientPacingSegmentStore,
    cacheValue: cache.TtlCache<LenientPacingSegment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientPacingSegment | undefined {
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

  save(item: LenientPacingSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientPacingSegment[] {
    return this.inner.list();
  }
}

export function newCachedLenientPacingSegmentStore(inner: LenientPacingSegmentStore, ttl: number, clockValue: clock.Clock): LenientPacingSegmentStore {
  return new CachedLenientPacingSegmentStore(
    inner,
    cache.newTtlCache<LenientPacingSegment>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient pacing segments. Empty fields match all. */
export class LenientPacingSegmentQuery {
  locale: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientPacingSegment): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientPacingSegment[]): LenientPacingSegment[] {
    const matched = collections.filter(items, (candidate: LenientPacingSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientPacingSegments(store: LenientPacingSegmentStore, query: LenientPacingSegmentQuery): LenientPacingSegment[] {
  return query.apply(store.list());
}
