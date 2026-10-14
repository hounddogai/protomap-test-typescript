import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingReputationSegment } from "./pending-reputation-segment.js";

/** Keeps pending reputation segments by code. */
export interface PendingReputationSegmentStore {
  find(code: string): PendingReputationSegment | undefined;
  save(item: PendingReputationSegment): void;
  remove(code: string): boolean;
  list(): PendingReputationSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingReputationSegmentStore implements PendingReputationSegmentStore {
  items: Map<string, PendingReputationSegment>;
  order: string[];

  constructor(items: Map<string, PendingReputationSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingReputationSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingReputationSegment): void {
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

  list(): PendingReputationSegment[] {
    const out: PendingReputationSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingReputationSegmentStore(): PendingReputationSegmentStore {
  return new MemoryPendingReputationSegmentStore(new Map<string, PendingReputationSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingReputationSegmentStore implements PendingReputationSegmentStore {
  inner: PendingReputationSegmentStore;
  cache: cache.TtlCache<PendingReputationSegment>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingReputationSegmentStore,
    cacheValue: cache.TtlCache<PendingReputationSegment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingReputationSegment | undefined {
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

  save(item: PendingReputationSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingReputationSegment[] {
    return this.inner.list();
  }
}

export function newCachedPendingReputationSegmentStore(inner: PendingReputationSegmentStore, ttl: number, clockValue: clock.Clock): PendingReputationSegmentStore {
  return new CachedPendingReputationSegmentStore(
    inner,
    cache.newTtlCache<PendingReputationSegment>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending reputation segments. Empty fields match all. */
export class PendingReputationSegmentQuery {
  title: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minCost: number, statuses: string[], limit: number) {
    this.title = title;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingReputationSegment): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingReputationSegment[]): PendingReputationSegment[] {
    const matched = collections.filter(items, (candidate: PendingReputationSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingReputationSegments(store: PendingReputationSegmentStore, query: PendingReputationSegmentQuery): PendingReputationSegment[] {
  return query.apply(store.list());
}
