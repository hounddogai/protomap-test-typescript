import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { EnrollmentSegment } from "./enrollment-segment.js";

/** Keeps enrollment segments by code. */
export interface EnrollmentSegmentStore {
  find(code: string): EnrollmentSegment | undefined;
  save(item: EnrollmentSegment): void;
  remove(code: string): boolean;
  list(): EnrollmentSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryEnrollmentSegmentStore implements EnrollmentSegmentStore {
  items: Map<string, EnrollmentSegment>;
  order: string[];

  constructor(items: Map<string, EnrollmentSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): EnrollmentSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: EnrollmentSegment): void {
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

  list(): EnrollmentSegment[] {
    const out: EnrollmentSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryEnrollmentSegmentStore(): EnrollmentSegmentStore {
  return new MemoryEnrollmentSegmentStore(new Map<string, EnrollmentSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedEnrollmentSegmentStore implements EnrollmentSegmentStore {
  inner: EnrollmentSegmentStore;
  cache: cache.TtlCache<EnrollmentSegment>;
  hits: number;
  misses: number;

  constructor(
    inner: EnrollmentSegmentStore,
    cacheValue: cache.TtlCache<EnrollmentSegment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): EnrollmentSegment | undefined {
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

  save(item: EnrollmentSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): EnrollmentSegment[] {
    return this.inner.list();
  }
}

export function newCachedEnrollmentSegmentStore(inner: EnrollmentSegmentStore, ttl: number, clockValue: clock.Clock): EnrollmentSegmentStore {
  return new CachedEnrollmentSegmentStore(inner, cache.newTtlCache<EnrollmentSegment>(512, ttl, clockValue), 0, 0);
}

/** Selects enrollment segments. Empty fields match all. */
export class EnrollmentSegmentQuery {
  unit: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minMaximum: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: EnrollmentSegment): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: EnrollmentSegment[]): EnrollmentSegment[] {
    const matched = collections.filter(items, (candidate: EnrollmentSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findEnrollmentSegments(store: EnrollmentSegmentStore, query: EnrollmentSegmentQuery): EnrollmentSegment[] {
  return query.apply(store.list());
}
