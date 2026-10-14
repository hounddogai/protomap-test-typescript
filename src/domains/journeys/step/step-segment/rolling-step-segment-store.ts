import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingStepSegment } from "./rolling-step-segment.js";

/** Keeps rolling step segments by code. */
export interface RollingStepSegmentStore {
  find(code: string): RollingStepSegment | undefined;
  save(item: RollingStepSegment): void;
  remove(code: string): boolean;
  list(): RollingStepSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingStepSegmentStore implements RollingStepSegmentStore {
  items: Map<string, RollingStepSegment>;
  order: string[];

  constructor(items: Map<string, RollingStepSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingStepSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingStepSegment): void {
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

  list(): RollingStepSegment[] {
    const out: RollingStepSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingStepSegmentStore(): RollingStepSegmentStore {
  return new MemoryRollingStepSegmentStore(new Map<string, RollingStepSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingStepSegmentStore implements RollingStepSegmentStore {
  inner: RollingStepSegmentStore;
  cache: cache.TtlCache<RollingStepSegment>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingStepSegmentStore,
    cacheValue: cache.TtlCache<RollingStepSegment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingStepSegment | undefined {
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

  save(item: RollingStepSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingStepSegment[] {
    return this.inner.list();
  }
}

export function newCachedRollingStepSegmentStore(inner: RollingStepSegmentStore, ttl: number, clockValue: clock.Clock): RollingStepSegmentStore {
  return new CachedRollingStepSegmentStore(inner, cache.newTtlCache<RollingStepSegment>(64, ttl, clockValue), 0, 0);
}

/** Selects rolling step segments. Empty fields match all. */
export class RollingStepSegmentQuery {
  channel: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minBatchSize: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingStepSegment): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingStepSegment[]): RollingStepSegment[] {
    const matched = collections.filter(items, (candidate: RollingStepSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingStepSegments(store: RollingStepSegmentStore, query: RollingStepSegmentQuery): RollingStepSegment[] {
  return query.apply(store.list());
}
