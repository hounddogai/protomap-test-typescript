import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SubscriptionSegment } from "./subscription-segment.js";

/** Keeps subscription segments by code. */
export interface SubscriptionSegmentStore {
  find(code: string): SubscriptionSegment | undefined;
  save(item: SubscriptionSegment): void;
  remove(code: string): boolean;
  list(): SubscriptionSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySubscriptionSegmentStore implements SubscriptionSegmentStore {
  items: Map<string, SubscriptionSegment>;
  order: string[];

  constructor(items: Map<string, SubscriptionSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SubscriptionSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SubscriptionSegment): void {
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

  list(): SubscriptionSegment[] {
    const out: SubscriptionSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySubscriptionSegmentStore(): SubscriptionSegmentStore {
  return new MemorySubscriptionSegmentStore(new Map<string, SubscriptionSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSubscriptionSegmentStore implements SubscriptionSegmentStore {
  inner: SubscriptionSegmentStore;
  cache: cache.TtlCache<SubscriptionSegment>;
  hits: number;
  misses: number;

  constructor(
    inner: SubscriptionSegmentStore,
    cacheValue: cache.TtlCache<SubscriptionSegment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SubscriptionSegment | undefined {
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

  save(item: SubscriptionSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SubscriptionSegment[] {
    return this.inner.list();
  }
}

export function newCachedSubscriptionSegmentStore(inner: SubscriptionSegmentStore, ttl: number, clockValue: clock.Clock): SubscriptionSegmentStore {
  return new CachedSubscriptionSegmentStore(inner, cache.newTtlCache<SubscriptionSegment>(256, ttl, clockValue), 0, 0);
}

/** Selects subscription segments. Empty fields match all. */
export class SubscriptionSegmentQuery {
  segment: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minRevision: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SubscriptionSegment): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SubscriptionSegment[]): SubscriptionSegment[] {
    const matched = collections.filter(items, (candidate: SubscriptionSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSubscriptionSegments(store: SubscriptionSegmentStore, query: SubscriptionSegmentQuery): SubscriptionSegment[] {
  return query.apply(store.list());
}
