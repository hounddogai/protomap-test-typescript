import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualTouchpointSegment } from "./manual-touchpoint-segment.js";

/** Keeps manual touchpoint segments by code. */
export interface ManualTouchpointSegmentStore {
  find(code: string): ManualTouchpointSegment | undefined;
  save(item: ManualTouchpointSegment): void;
  remove(code: string): boolean;
  list(): ManualTouchpointSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualTouchpointSegmentStore implements ManualTouchpointSegmentStore {
  items: Map<string, ManualTouchpointSegment>;
  order: string[];

  constructor(items: Map<string, ManualTouchpointSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualTouchpointSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualTouchpointSegment): void {
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

  list(): ManualTouchpointSegment[] {
    const out: ManualTouchpointSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualTouchpointSegmentStore(): ManualTouchpointSegmentStore {
  return new MemoryManualTouchpointSegmentStore(new Map<string, ManualTouchpointSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualTouchpointSegmentStore implements ManualTouchpointSegmentStore {
  inner: ManualTouchpointSegmentStore;
  cache: cache.TtlCache<ManualTouchpointSegment>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualTouchpointSegmentStore,
    cacheValue: cache.TtlCache<ManualTouchpointSegment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualTouchpointSegment | undefined {
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

  save(item: ManualTouchpointSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualTouchpointSegment[] {
    return this.inner.list();
  }
}

export function newCachedManualTouchpointSegmentStore(inner: ManualTouchpointSegmentStore, ttl: number, clockValue: clock.Clock): ManualTouchpointSegmentStore {
  return new CachedManualTouchpointSegmentStore(
    inner,
    cache.newTtlCache<ManualTouchpointSegment>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects manual touchpoint segments. Empty fields match all. */
export class ManualTouchpointSegmentQuery {
  channel: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minCost: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualTouchpointSegment): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualTouchpointSegment[]): ManualTouchpointSegment[] {
    const matched = collections.filter(items, (candidate: ManualTouchpointSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualTouchpointSegments(store: ManualTouchpointSegmentStore, query: ManualTouchpointSegmentQuery): ManualTouchpointSegment[] {
  return query.apply(store.list());
}
