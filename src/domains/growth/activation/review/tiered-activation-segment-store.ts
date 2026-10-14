import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredActivationSegment } from "./tiered-activation-segment.js";

/** Keeps tiered activation segments by code. */
export interface TieredActivationSegmentStore {
  find(code: string): TieredActivationSegment | undefined;
  save(item: TieredActivationSegment): void;
  remove(code: string): boolean;
  list(): TieredActivationSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredActivationSegmentStore implements TieredActivationSegmentStore {
  items: Map<string, TieredActivationSegment>;
  order: string[];

  constructor(items: Map<string, TieredActivationSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredActivationSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredActivationSegment): void {
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

  list(): TieredActivationSegment[] {
    const out: TieredActivationSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredActivationSegmentStore(): TieredActivationSegmentStore {
  return new MemoryTieredActivationSegmentStore(new Map<string, TieredActivationSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredActivationSegmentStore implements TieredActivationSegmentStore {
  inner: TieredActivationSegmentStore;
  cache: cache.TtlCache<TieredActivationSegment>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredActivationSegmentStore,
    cacheValue: cache.TtlCache<TieredActivationSegment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredActivationSegment | undefined {
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

  save(item: TieredActivationSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredActivationSegment[] {
    return this.inner.list();
  }
}

export function newCachedTieredActivationSegmentStore(inner: TieredActivationSegmentStore, ttl: number, clockValue: clock.Clock): TieredActivationSegmentStore {
  return new CachedTieredActivationSegmentStore(
    inner,
    cache.newTtlCache<TieredActivationSegment>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered activation segments. Empty fields match all. */
export class TieredActivationSegmentQuery {
  label: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minCapacity: number, statuses: string[], limit: number) {
    this.label = label;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredActivationSegment): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredActivationSegment[]): TieredActivationSegment[] {
    const matched = collections.filter(items, (candidate: TieredActivationSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredActivationSegments(store: TieredActivationSegmentStore, query: TieredActivationSegmentQuery): TieredActivationSegment[] {
  return query.apply(store.list());
}
