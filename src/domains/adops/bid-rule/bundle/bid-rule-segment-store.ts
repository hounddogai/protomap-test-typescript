import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BidRuleSegment } from "./bid-rule-segment.js";

/** Keeps bid rule segments by code. */
export interface BidRuleSegmentStore {
  find(code: string): BidRuleSegment | undefined;
  save(item: BidRuleSegment): void;
  remove(code: string): boolean;
  list(): BidRuleSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBidRuleSegmentStore implements BidRuleSegmentStore {
  items: Map<string, BidRuleSegment>;
  order: string[];

  constructor(items: Map<string, BidRuleSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BidRuleSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BidRuleSegment): void {
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

  list(): BidRuleSegment[] {
    const out: BidRuleSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBidRuleSegmentStore(): BidRuleSegmentStore {
  return new MemoryBidRuleSegmentStore(new Map<string, BidRuleSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBidRuleSegmentStore implements BidRuleSegmentStore {
  inner: BidRuleSegmentStore;
  cache: cache.TtlCache<BidRuleSegment>;
  hits: number;
  misses: number;

  constructor(
    inner: BidRuleSegmentStore,
    cacheValue: cache.TtlCache<BidRuleSegment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BidRuleSegment | undefined {
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

  save(item: BidRuleSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BidRuleSegment[] {
    return this.inner.list();
  }
}

export function newCachedBidRuleSegmentStore(inner: BidRuleSegmentStore, ttl: number, clockValue: clock.Clock): BidRuleSegmentStore {
  return new CachedBidRuleSegmentStore(inner, cache.newTtlCache<BidRuleSegment>(256, ttl, clockValue), 0, 0);
}

/** Selects bid rule segments. Empty fields match all. */
export class BidRuleSegmentQuery {
  label: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minCeiling: number, statuses: string[], limit: number) {
    this.label = label;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BidRuleSegment): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BidRuleSegment[]): BidRuleSegment[] {
    const matched = collections.filter(items, (candidate: BidRuleSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBidRuleSegments(store: BidRuleSegmentStore, query: BidRuleSegmentQuery): BidRuleSegment[] {
  return query.apply(store.list());
}
