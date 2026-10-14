import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyPayoutSegment } from "./legacy-payout-segment.js";

/** Keeps legacy payout segments by code. */
export interface LegacyPayoutSegmentStore {
  find(code: string): LegacyPayoutSegment | undefined;
  save(item: LegacyPayoutSegment): void;
  remove(code: string): boolean;
  list(): LegacyPayoutSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyPayoutSegmentStore implements LegacyPayoutSegmentStore {
  items: Map<string, LegacyPayoutSegment>;
  order: string[];

  constructor(items: Map<string, LegacyPayoutSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyPayoutSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyPayoutSegment): void {
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

  list(): LegacyPayoutSegment[] {
    const out: LegacyPayoutSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyPayoutSegmentStore(): LegacyPayoutSegmentStore {
  return new MemoryLegacyPayoutSegmentStore(new Map<string, LegacyPayoutSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyPayoutSegmentStore implements LegacyPayoutSegmentStore {
  inner: LegacyPayoutSegmentStore;
  cache: cache.TtlCache<LegacyPayoutSegment>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyPayoutSegmentStore,
    cacheValue: cache.TtlCache<LegacyPayoutSegment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyPayoutSegment | undefined {
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

  save(item: LegacyPayoutSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyPayoutSegment[] {
    return this.inner.list();
  }
}

export function newCachedLegacyPayoutSegmentStore(inner: LegacyPayoutSegmentStore, ttl: number, clockValue: clock.Clock): LegacyPayoutSegmentStore {
  return new CachedLegacyPayoutSegmentStore(inner, cache.newTtlCache<LegacyPayoutSegment>(1024, ttl, clockValue), 0, 0);
}

/** Selects legacy payout segments. Empty fields match all. */
export class LegacyPayoutSegmentQuery {
  unit: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minRetries: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyPayoutSegment): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyPayoutSegment[]): LegacyPayoutSegment[] {
    const matched = collections.filter(items, (candidate: LegacyPayoutSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyPayoutSegments(store: LegacyPayoutSegmentStore, query: LegacyPayoutSegmentQuery): LegacyPayoutSegment[] {
  return query.apply(store.list());
}
