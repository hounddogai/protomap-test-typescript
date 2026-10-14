import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientPayoutSegment } from "./lenient-payout-segment.js";

/** Keeps lenient payout segments by code. */
export interface LenientPayoutSegmentStore {
  find(code: string): LenientPayoutSegment | undefined;
  save(item: LenientPayoutSegment): void;
  remove(code: string): boolean;
  list(): LenientPayoutSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientPayoutSegmentStore implements LenientPayoutSegmentStore {
  items: Map<string, LenientPayoutSegment>;
  order: string[];

  constructor(items: Map<string, LenientPayoutSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientPayoutSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientPayoutSegment): void {
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

  list(): LenientPayoutSegment[] {
    const out: LenientPayoutSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientPayoutSegmentStore(): LenientPayoutSegmentStore {
  return new MemoryLenientPayoutSegmentStore(new Map<string, LenientPayoutSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientPayoutSegmentStore implements LenientPayoutSegmentStore {
  inner: LenientPayoutSegmentStore;
  cache: cache.TtlCache<LenientPayoutSegment>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientPayoutSegmentStore,
    cacheValue: cache.TtlCache<LenientPayoutSegment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientPayoutSegment | undefined {
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

  save(item: LenientPayoutSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientPayoutSegment[] {
    return this.inner.list();
  }
}

export function newCachedLenientPayoutSegmentStore(inner: LenientPayoutSegmentStore, ttl: number, clockValue: clock.Clock): LenientPayoutSegmentStore {
  return new CachedLenientPayoutSegmentStore(
    inner,
    cache.newTtlCache<LenientPayoutSegment>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient payout segments. Empty fields match all. */
export class LenientPayoutSegmentQuery {
  unit: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientPayoutSegment): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientPayoutSegment[]): LenientPayoutSegment[] {
    const matched = collections.filter(items, (candidate: LenientPayoutSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientPayoutSegments(store: LenientPayoutSegmentStore, query: LenientPayoutSegmentQuery): LenientPayoutSegment[] {
  return query.apply(store.list());
}
