import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientCsatReview } from "./lenient-csat-review.js";

/** Keeps lenient csat reviews by code. */
export interface LenientCsatReviewStore {
  find(code: string): LenientCsatReview | undefined;
  save(item: LenientCsatReview): void;
  remove(code: string): boolean;
  list(): LenientCsatReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientCsatReviewStore implements LenientCsatReviewStore {
  items: Map<string, LenientCsatReview>;
  order: string[];

  constructor(items: Map<string, LenientCsatReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientCsatReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientCsatReview): void {
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

  list(): LenientCsatReview[] {
    const out: LenientCsatReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientCsatReviewStore(): LenientCsatReviewStore {
  return new MemoryLenientCsatReviewStore(new Map<string, LenientCsatReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientCsatReviewStore implements LenientCsatReviewStore {
  inner: LenientCsatReviewStore;
  cache: cache.TtlCache<LenientCsatReview>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientCsatReviewStore,
    cacheValue: cache.TtlCache<LenientCsatReview>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientCsatReview | undefined {
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

  save(item: LenientCsatReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientCsatReview[] {
    return this.inner.list();
  }
}

export function newCachedLenientCsatReviewStore(inner: LenientCsatReviewStore, ttl: number, clockValue: clock.Clock): LenientCsatReviewStore {
  return new CachedLenientCsatReviewStore(inner, cache.newTtlCache<LenientCsatReview>(1024, ttl, clockValue), 0, 0);
}

/** Selects lenient csat reviews. Empty fields match all. */
export class LenientCsatReviewQuery {
  unit: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minBid: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientCsatReview): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientCsatReview[]): LenientCsatReview[] {
    const matched = collections.filter(items, (candidate: LenientCsatReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientCsatReviews(store: LenientCsatReviewStore, query: LenientCsatReviewQuery): LenientCsatReview[] {
  return query.apply(store.list());
}
