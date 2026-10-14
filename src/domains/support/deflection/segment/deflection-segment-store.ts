import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DeflectionSegment } from "./deflection-segment.js";

/** Keeps deflection segments by code. */
export interface DeflectionSegmentStore {
  find(code: string): DeflectionSegment | undefined;
  save(item: DeflectionSegment): void;
  remove(code: string): boolean;
  list(): DeflectionSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDeflectionSegmentStore implements DeflectionSegmentStore {
  items: Map<string, DeflectionSegment>;
  order: string[];

  constructor(items: Map<string, DeflectionSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DeflectionSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DeflectionSegment): void {
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

  list(): DeflectionSegment[] {
    const out: DeflectionSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDeflectionSegmentStore(): DeflectionSegmentStore {
  return new MemoryDeflectionSegmentStore(new Map<string, DeflectionSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDeflectionSegmentStore implements DeflectionSegmentStore {
  inner: DeflectionSegmentStore;
  cache: cache.TtlCache<DeflectionSegment>;
  hits: number;
  misses: number;

  constructor(
    inner: DeflectionSegmentStore,
    cacheValue: cache.TtlCache<DeflectionSegment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DeflectionSegment | undefined {
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

  save(item: DeflectionSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DeflectionSegment[] {
    return this.inner.list();
  }
}

export function newCachedDeflectionSegmentStore(inner: DeflectionSegmentStore, ttl: number, clockValue: clock.Clock): DeflectionSegmentStore {
  return new CachedDeflectionSegmentStore(inner, cache.newTtlCache<DeflectionSegment>(64, ttl, clockValue), 0, 0);
}

/** Selects deflection segments. Empty fields match all. */
export class DeflectionSegmentQuery {
  unit: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minMinimum: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DeflectionSegment): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DeflectionSegment[]): DeflectionSegment[] {
    const matched = collections.filter(items, (candidate: DeflectionSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDeflectionSegments(store: DeflectionSegmentStore, query: DeflectionSegmentQuery): DeflectionSegment[] {
  return query.apply(store.list());
}
