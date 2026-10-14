import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingTierSegment } from "./rolling-tier-segment.js";

/** Keeps rolling tier segments by code. */
export interface RollingTierSegmentStore {
  find(code: string): RollingTierSegment | undefined;
  save(item: RollingTierSegment): void;
  remove(code: string): boolean;
  list(): RollingTierSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingTierSegmentStore implements RollingTierSegmentStore {
  items: Map<string, RollingTierSegment>;
  order: string[];

  constructor(items: Map<string, RollingTierSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingTierSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingTierSegment): void {
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

  list(): RollingTierSegment[] {
    const out: RollingTierSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingTierSegmentStore(): RollingTierSegmentStore {
  return new MemoryRollingTierSegmentStore(new Map<string, RollingTierSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingTierSegmentStore implements RollingTierSegmentStore {
  inner: RollingTierSegmentStore;
  cache: cache.TtlCache<RollingTierSegment>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingTierSegmentStore,
    cacheValue: cache.TtlCache<RollingTierSegment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingTierSegment | undefined {
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

  save(item: RollingTierSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingTierSegment[] {
    return this.inner.list();
  }
}

export function newCachedRollingTierSegmentStore(inner: RollingTierSegmentStore, ttl: number, clockValue: clock.Clock): RollingTierSegmentStore {
  return new CachedRollingTierSegmentStore(inner, cache.newTtlCache<RollingTierSegment>(256, ttl, clockValue), 0, 0);
}

/** Selects rolling tier segments. Empty fields match all. */
export class RollingTierSegmentQuery {
  label: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minPriority: number, statuses: string[], limit: number) {
    this.label = label;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingTierSegment): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingTierSegment[]): RollingTierSegment[] {
    const matched = collections.filter(items, (candidate: RollingTierSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingTierSegments(store: RollingTierSegmentStore, query: RollingTierSegmentQuery): RollingTierSegment[] {
  return query.apply(store.list());
}
