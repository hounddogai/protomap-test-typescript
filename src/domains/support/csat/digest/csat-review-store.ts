import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CsatReview } from "./csat-review.js";

/** Keeps csat reviews by code. */
export interface CsatReviewStore {
  find(code: string): CsatReview | undefined;
  save(item: CsatReview): void;
  remove(code: string): boolean;
  list(): CsatReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCsatReviewStore implements CsatReviewStore {
  items: Map<string, CsatReview>;
  order: string[];

  constructor(items: Map<string, CsatReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CsatReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CsatReview): void {
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

  list(): CsatReview[] {
    const out: CsatReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCsatReviewStore(): CsatReviewStore {
  return new MemoryCsatReviewStore(new Map<string, CsatReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCsatReviewStore implements CsatReviewStore {
  inner: CsatReviewStore;
  cache: cache.TtlCache<CsatReview>;
  hits: number;
  misses: number;

  constructor(inner: CsatReviewStore, cacheValue: cache.TtlCache<CsatReview>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CsatReview | undefined {
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

  save(item: CsatReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CsatReview[] {
    return this.inner.list();
  }
}

export function newCachedCsatReviewStore(inner: CsatReviewStore, ttl: number, clockValue: clock.Clock): CsatReviewStore {
  return new CachedCsatReviewStore(inner, cache.newTtlCache<CsatReview>(256, ttl, clockValue), 0, 0);
}

/** Selects csat reviews. Empty fields match all. */
export class CsatReviewQuery {
  category: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minDiscount: number, statuses: string[], limit: number) {
    this.category = category;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CsatReview): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CsatReview[]): CsatReview[] {
    const matched = collections.filter(items, (candidate: CsatReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCsatReviews(store: CsatReviewStore, query: CsatReviewQuery): CsatReview[] {
  return query.apply(store.list());
}
