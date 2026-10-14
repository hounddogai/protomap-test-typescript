import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RedemptionSegment } from "./redemption-segment.js";

/** Keeps redemption segments by code. */
export interface RedemptionSegmentStore {
  find(code: string): RedemptionSegment | undefined;
  save(item: RedemptionSegment): void;
  remove(code: string): boolean;
  list(): RedemptionSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRedemptionSegmentStore implements RedemptionSegmentStore {
  items: Map<string, RedemptionSegment>;
  order: string[];

  constructor(items: Map<string, RedemptionSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RedemptionSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RedemptionSegment): void {
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

  list(): RedemptionSegment[] {
    const out: RedemptionSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRedemptionSegmentStore(): RedemptionSegmentStore {
  return new MemoryRedemptionSegmentStore(new Map<string, RedemptionSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRedemptionSegmentStore implements RedemptionSegmentStore {
  inner: RedemptionSegmentStore;
  cache: cache.TtlCache<RedemptionSegment>;
  hits: number;
  misses: number;

  constructor(
    inner: RedemptionSegmentStore,
    cacheValue: cache.TtlCache<RedemptionSegment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RedemptionSegment | undefined {
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

  save(item: RedemptionSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RedemptionSegment[] {
    return this.inner.list();
  }
}

export function newCachedRedemptionSegmentStore(inner: RedemptionSegmentStore, ttl: number, clockValue: clock.Clock): RedemptionSegmentStore {
  return new CachedRedemptionSegmentStore(inner, cache.newTtlCache<RedemptionSegment>(256, ttl, clockValue), 0, 0);
}

/** Selects redemption segments. Empty fields match all. */
export class RedemptionSegmentQuery {
  utmSource: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minSendAt: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RedemptionSegment): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RedemptionSegment[]): RedemptionSegment[] {
    const matched = collections.filter(items, (candidate: RedemptionSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRedemptionSegments(store: RedemptionSegmentStore, query: RedemptionSegmentQuery): RedemptionSegment[] {
  return query.apply(store.list());
}
