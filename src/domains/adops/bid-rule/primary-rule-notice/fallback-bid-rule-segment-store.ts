import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackBidRuleSegment } from "./fallback-bid-rule-segment.js";

/** Keeps fallback bid rule segments by code. */
export interface FallbackBidRuleSegmentStore {
  find(code: string): FallbackBidRuleSegment | undefined;
  save(item: FallbackBidRuleSegment): void;
  remove(code: string): boolean;
  list(): FallbackBidRuleSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackBidRuleSegmentStore implements FallbackBidRuleSegmentStore {
  items: Map<string, FallbackBidRuleSegment>;
  order: string[];

  constructor(items: Map<string, FallbackBidRuleSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackBidRuleSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackBidRuleSegment): void {
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

  list(): FallbackBidRuleSegment[] {
    const out: FallbackBidRuleSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackBidRuleSegmentStore(): FallbackBidRuleSegmentStore {
  return new MemoryFallbackBidRuleSegmentStore(new Map<string, FallbackBidRuleSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackBidRuleSegmentStore implements FallbackBidRuleSegmentStore {
  inner: FallbackBidRuleSegmentStore;
  cache: cache.TtlCache<FallbackBidRuleSegment>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackBidRuleSegmentStore,
    cacheValue: cache.TtlCache<FallbackBidRuleSegment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackBidRuleSegment | undefined {
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

  save(item: FallbackBidRuleSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackBidRuleSegment[] {
    return this.inner.list();
  }
}

export function newCachedFallbackBidRuleSegmentStore(inner: FallbackBidRuleSegmentStore, ttl: number, clockValue: clock.Clock): FallbackBidRuleSegmentStore {
  return new CachedFallbackBidRuleSegmentStore(
    inner,
    cache.newTtlCache<FallbackBidRuleSegment>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback bid rule segments. Empty fields match all. */
export class FallbackBidRuleSegmentQuery {
  label: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minRetries: number, statuses: string[], limit: number) {
    this.label = label;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackBidRuleSegment): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackBidRuleSegment[]): FallbackBidRuleSegment[] {
    const matched = collections.filter(items, (candidate: FallbackBidRuleSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackBidRuleSegments(store: FallbackBidRuleSegmentStore, query: FallbackBidRuleSegmentQuery): FallbackBidRuleSegment[] {
  return query.apply(store.list());
}
