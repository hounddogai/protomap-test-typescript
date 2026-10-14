import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { OptOutSegment } from "./opt-out-segment.js";

/** Keeps opt out segments by code. */
export interface OptOutSegmentStore {
  find(code: string): OptOutSegment | undefined;
  save(item: OptOutSegment): void;
  remove(code: string): boolean;
  list(): OptOutSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryOptOutSegmentStore implements OptOutSegmentStore {
  items: Map<string, OptOutSegment>;
  order: string[];

  constructor(items: Map<string, OptOutSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): OptOutSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: OptOutSegment): void {
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

  list(): OptOutSegment[] {
    const out: OptOutSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryOptOutSegmentStore(): OptOutSegmentStore {
  return new MemoryOptOutSegmentStore(new Map<string, OptOutSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedOptOutSegmentStore implements OptOutSegmentStore {
  inner: OptOutSegmentStore;
  cache: cache.TtlCache<OptOutSegment>;
  hits: number;
  misses: number;

  constructor(inner: OptOutSegmentStore, cacheValue: cache.TtlCache<OptOutSegment>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): OptOutSegment | undefined {
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

  save(item: OptOutSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): OptOutSegment[] {
    return this.inner.list();
  }
}

export function newCachedOptOutSegmentStore(inner: OptOutSegmentStore, ttl: number, clockValue: clock.Clock): OptOutSegmentStore {
  return new CachedOptOutSegmentStore(inner, cache.newTtlCache<OptOutSegment>(128, ttl, clockValue), 0, 0);
}

/** Selects opt out segments. Empty fields match all. */
export class OptOutSegmentQuery {
  title: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minCeiling: number, statuses: string[], limit: number) {
    this.title = title;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: OptOutSegment): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: OptOutSegment[]): OptOutSegment[] {
    const matched = collections.filter(items, (candidate: OptOutSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findOptOutSegments(store: OptOutSegmentStore, query: OptOutSegmentQuery): OptOutSegment[] {
  return query.apply(store.list());
}
