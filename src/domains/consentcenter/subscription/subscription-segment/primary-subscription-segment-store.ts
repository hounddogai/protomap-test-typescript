import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimarySubscriptionSegment } from "./primary-subscription-segment.js";

/** Keeps primary subscription segments by code. */
export interface PrimarySubscriptionSegmentStore {
  find(code: string): PrimarySubscriptionSegment | undefined;
  save(item: PrimarySubscriptionSegment): void;
  remove(code: string): boolean;
  list(): PrimarySubscriptionSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimarySubscriptionSegmentStore implements PrimarySubscriptionSegmentStore {
  items: Map<string, PrimarySubscriptionSegment>;
  order: string[];

  constructor(items: Map<string, PrimarySubscriptionSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimarySubscriptionSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimarySubscriptionSegment): void {
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

  list(): PrimarySubscriptionSegment[] {
    const out: PrimarySubscriptionSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimarySubscriptionSegmentStore(): PrimarySubscriptionSegmentStore {
  return new MemoryPrimarySubscriptionSegmentStore(new Map<string, PrimarySubscriptionSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimarySubscriptionSegmentStore implements PrimarySubscriptionSegmentStore {
  inner: PrimarySubscriptionSegmentStore;
  cache: cache.TtlCache<PrimarySubscriptionSegment>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimarySubscriptionSegmentStore,
    cacheValue: cache.TtlCache<PrimarySubscriptionSegment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimarySubscriptionSegment | undefined {
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

  save(item: PrimarySubscriptionSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimarySubscriptionSegment[] {
    return this.inner.list();
  }
}

export function newCachedPrimarySubscriptionSegmentStore(inner: PrimarySubscriptionSegmentStore, ttl: number, clockValue: clock.Clock): PrimarySubscriptionSegmentStore {
  return new CachedPrimarySubscriptionSegmentStore(
    inner,
    cache.newTtlCache<PrimarySubscriptionSegment>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary subscription segments. Empty fields match all. */
export class PrimarySubscriptionSegmentQuery {
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

  matches(item: PrimarySubscriptionSegment): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimarySubscriptionSegment[]): PrimarySubscriptionSegment[] {
    const matched = collections.filter(items, (candidate: PrimarySubscriptionSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimarySubscriptionSegments(store: PrimarySubscriptionSegmentStore, query: PrimarySubscriptionSegmentQuery): PrimarySubscriptionSegment[] {
  return query.apply(store.list());
}
