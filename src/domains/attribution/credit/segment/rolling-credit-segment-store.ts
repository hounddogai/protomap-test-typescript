import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingCreditSegment } from "./rolling-credit-segment.js";

/** Keeps rolling credit segments by code. */
export interface RollingCreditSegmentStore {
  find(code: string): RollingCreditSegment | undefined;
  save(item: RollingCreditSegment): void;
  remove(code: string): boolean;
  list(): RollingCreditSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingCreditSegmentStore implements RollingCreditSegmentStore {
  items: Map<string, RollingCreditSegment>;
  order: string[];

  constructor(items: Map<string, RollingCreditSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingCreditSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingCreditSegment): void {
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

  list(): RollingCreditSegment[] {
    const out: RollingCreditSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingCreditSegmentStore(): RollingCreditSegmentStore {
  return new MemoryRollingCreditSegmentStore(new Map<string, RollingCreditSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingCreditSegmentStore implements RollingCreditSegmentStore {
  inner: RollingCreditSegmentStore;
  cache: cache.TtlCache<RollingCreditSegment>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingCreditSegmentStore,
    cacheValue: cache.TtlCache<RollingCreditSegment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingCreditSegment | undefined {
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

  save(item: RollingCreditSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingCreditSegment[] {
    return this.inner.list();
  }
}

export function newCachedRollingCreditSegmentStore(inner: RollingCreditSegmentStore, ttl: number, clockValue: clock.Clock): RollingCreditSegmentStore {
  return new CachedRollingCreditSegmentStore(
    inner,
    cache.newTtlCache<RollingCreditSegment>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling credit segments. Empty fields match all. */
export class RollingCreditSegmentQuery {
  source: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minCeiling: number, statuses: string[], limit: number) {
    this.source = source;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingCreditSegment): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingCreditSegment[]): RollingCreditSegment[] {
    const matched = collections.filter(items, (candidate: RollingCreditSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingCreditSegments(store: RollingCreditSegmentStore, query: RollingCreditSegmentQuery): RollingCreditSegment[] {
  return query.apply(store.list());
}
