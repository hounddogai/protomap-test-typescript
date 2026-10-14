import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledPreferenceSegment } from "./scheduled-preference-segment.js";

/** Keeps scheduled preference segments by code. */
export interface ScheduledPreferenceSegmentStore {
  find(code: string): ScheduledPreferenceSegment | undefined;
  save(item: ScheduledPreferenceSegment): void;
  remove(code: string): boolean;
  list(): ScheduledPreferenceSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledPreferenceSegmentStore implements ScheduledPreferenceSegmentStore {
  items: Map<string, ScheduledPreferenceSegment>;
  order: string[];

  constructor(items: Map<string, ScheduledPreferenceSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledPreferenceSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledPreferenceSegment): void {
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

  list(): ScheduledPreferenceSegment[] {
    const out: ScheduledPreferenceSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledPreferenceSegmentStore(): ScheduledPreferenceSegmentStore {
  return new MemoryScheduledPreferenceSegmentStore(new Map<string, ScheduledPreferenceSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledPreferenceSegmentStore implements ScheduledPreferenceSegmentStore {
  inner: ScheduledPreferenceSegmentStore;
  cache: cache.TtlCache<ScheduledPreferenceSegment>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledPreferenceSegmentStore,
    cacheValue: cache.TtlCache<ScheduledPreferenceSegment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledPreferenceSegment | undefined {
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

  save(item: ScheduledPreferenceSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledPreferenceSegment[] {
    return this.inner.list();
  }
}

export function newCachedScheduledPreferenceSegmentStore(inner: ScheduledPreferenceSegmentStore, ttl: number, clockValue: clock.Clock): ScheduledPreferenceSegmentStore {
  return new CachedScheduledPreferenceSegmentStore(
    inner,
    cache.newTtlCache<ScheduledPreferenceSegment>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled preference segments. Empty fields match all. */
export class ScheduledPreferenceSegmentQuery {
  category: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minDiscount: number, statuses: string[], limit: number) {
    this.category = category;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledPreferenceSegment): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledPreferenceSegment[]): ScheduledPreferenceSegment[] {
    const matched = collections.filter(items, (candidate: ScheduledPreferenceSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledPreferenceSegments(store: ScheduledPreferenceSegmentStore, query: ScheduledPreferenceSegmentQuery): ScheduledPreferenceSegment[] {
  return query.apply(store.list());
}
