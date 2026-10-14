import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingBidRuleSegment } from "./pending-bid-rule-segment.js";

/** Keeps pending bid rule segments by code. */
export interface PendingBidRuleSegmentStore {
  find(code: string): PendingBidRuleSegment | undefined;
  save(item: PendingBidRuleSegment): void;
  remove(code: string): boolean;
  list(): PendingBidRuleSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingBidRuleSegmentStore implements PendingBidRuleSegmentStore {
  items: Map<string, PendingBidRuleSegment>;
  order: string[];

  constructor(items: Map<string, PendingBidRuleSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingBidRuleSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingBidRuleSegment): void {
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

  list(): PendingBidRuleSegment[] {
    const out: PendingBidRuleSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingBidRuleSegmentStore(): PendingBidRuleSegmentStore {
  return new MemoryPendingBidRuleSegmentStore(new Map<string, PendingBidRuleSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingBidRuleSegmentStore implements PendingBidRuleSegmentStore {
  inner: PendingBidRuleSegmentStore;
  cache: cache.TtlCache<PendingBidRuleSegment>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingBidRuleSegmentStore,
    cacheValue: cache.TtlCache<PendingBidRuleSegment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingBidRuleSegment | undefined {
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

  save(item: PendingBidRuleSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingBidRuleSegment[] {
    return this.inner.list();
  }
}

export function newCachedPendingBidRuleSegmentStore(inner: PendingBidRuleSegmentStore, ttl: number, clockValue: clock.Clock): PendingBidRuleSegmentStore {
  return new CachedPendingBidRuleSegmentStore(
    inner,
    cache.newTtlCache<PendingBidRuleSegment>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending bid rule segments. Empty fields match all. */
export class PendingBidRuleSegmentQuery {
  channel: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minWindowDays: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingBidRuleSegment): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingBidRuleSegment[]): PendingBidRuleSegment[] {
    const matched = collections.filter(items, (candidate: PendingBidRuleSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingBidRuleSegments(store: PendingBidRuleSegmentStore, query: PendingBidRuleSegmentQuery): PendingBidRuleSegment[] {
  return query.apply(store.list());
}
