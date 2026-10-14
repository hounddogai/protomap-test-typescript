import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SuppressionSegment } from "./suppression-segment.js";

/** Keeps suppression segments by code. */
export interface SuppressionSegmentStore {
  find(code: string): SuppressionSegment | undefined;
  save(item: SuppressionSegment): void;
  remove(code: string): boolean;
  list(): SuppressionSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySuppressionSegmentStore implements SuppressionSegmentStore {
  items: Map<string, SuppressionSegment>;
  order: string[];

  constructor(items: Map<string, SuppressionSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SuppressionSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SuppressionSegment): void {
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

  list(): SuppressionSegment[] {
    const out: SuppressionSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySuppressionSegmentStore(): SuppressionSegmentStore {
  return new MemorySuppressionSegmentStore(new Map<string, SuppressionSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSuppressionSegmentStore implements SuppressionSegmentStore {
  inner: SuppressionSegmentStore;
  cache: cache.TtlCache<SuppressionSegment>;
  hits: number;
  misses: number;

  constructor(
    inner: SuppressionSegmentStore,
    cacheValue: cache.TtlCache<SuppressionSegment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SuppressionSegment | undefined {
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

  save(item: SuppressionSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SuppressionSegment[] {
    return this.inner.list();
  }
}

export function newCachedSuppressionSegmentStore(inner: SuppressionSegmentStore, ttl: number, clockValue: clock.Clock): SuppressionSegmentStore {
  return new CachedSuppressionSegmentStore(inner, cache.newTtlCache<SuppressionSegment>(1024, ttl, clockValue), 0, 0);
}

/** Selects suppression segments. Empty fields match all. */
export class SuppressionSegmentQuery {
  locale: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minAmount: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SuppressionSegment): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SuppressionSegment[]): SuppressionSegment[] {
    const matched = collections.filter(items, (candidate: SuppressionSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSuppressionSegments(store: SuppressionSegmentStore, query: SuppressionSegmentQuery): SuppressionSegment[] {
  return query.apply(store.list());
}
