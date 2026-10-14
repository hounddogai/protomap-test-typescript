import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictSenderSegment } from "./strict-sender-segment.js";

/** Keeps strict sender segments by code. */
export interface StrictSenderSegmentStore {
  find(code: string): StrictSenderSegment | undefined;
  save(item: StrictSenderSegment): void;
  remove(code: string): boolean;
  list(): StrictSenderSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictSenderSegmentStore implements StrictSenderSegmentStore {
  items: Map<string, StrictSenderSegment>;
  order: string[];

  constructor(items: Map<string, StrictSenderSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictSenderSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictSenderSegment): void {
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

  list(): StrictSenderSegment[] {
    const out: StrictSenderSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictSenderSegmentStore(): StrictSenderSegmentStore {
  return new MemoryStrictSenderSegmentStore(new Map<string, StrictSenderSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictSenderSegmentStore implements StrictSenderSegmentStore {
  inner: StrictSenderSegmentStore;
  cache: cache.TtlCache<StrictSenderSegment>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictSenderSegmentStore,
    cacheValue: cache.TtlCache<StrictSenderSegment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictSenderSegment | undefined {
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

  save(item: StrictSenderSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictSenderSegment[] {
    return this.inner.list();
  }
}

export function newCachedStrictSenderSegmentStore(inner: StrictSenderSegmentStore, ttl: number, clockValue: clock.Clock): StrictSenderSegmentStore {
  return new CachedStrictSenderSegmentStore(inner, cache.newTtlCache<StrictSenderSegment>(512, ttl, clockValue), 0, 0);
}

/** Selects strict sender segments. Empty fields match all. */
export class StrictSenderSegmentQuery {
  title: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minMinimum: number, statuses: string[], limit: number) {
    this.title = title;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictSenderSegment): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictSenderSegment[]): StrictSenderSegment[] {
    const matched = collections.filter(items, (candidate: StrictSenderSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictSenderSegments(store: StrictSenderSegmentStore, query: StrictSenderSegmentQuery): StrictSenderSegment[] {
  return query.apply(store.list());
}
