import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ConversionReview } from "./conversion-review.js";

/** Keeps conversion reviews by code. */
export interface ConversionReviewStore {
  find(code: string): ConversionReview | undefined;
  save(item: ConversionReview): void;
  remove(code: string): boolean;
  list(): ConversionReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryConversionReviewStore implements ConversionReviewStore {
  items: Map<string, ConversionReview>;
  order: string[];

  constructor(items: Map<string, ConversionReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ConversionReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ConversionReview): void {
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

  list(): ConversionReview[] {
    const out: ConversionReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryConversionReviewStore(): ConversionReviewStore {
  return new MemoryConversionReviewStore(new Map<string, ConversionReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedConversionReviewStore implements ConversionReviewStore {
  inner: ConversionReviewStore;
  cache: cache.TtlCache<ConversionReview>;
  hits: number;
  misses: number;

  constructor(
    inner: ConversionReviewStore,
    cacheValue: cache.TtlCache<ConversionReview>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ConversionReview | undefined {
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

  save(item: ConversionReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ConversionReview[] {
    return this.inner.list();
  }
}

export function newCachedConversionReviewStore(inner: ConversionReviewStore, ttl: number, clockValue: clock.Clock): ConversionReviewStore {
  return new CachedConversionReviewStore(inner, cache.newTtlCache<ConversionReview>(64, ttl, clockValue), 0, 0);
}

/** Selects conversion reviews. Empty fields match all. */
export class ConversionReviewQuery {
  locale: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minOpenRate: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ConversionReview): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ConversionReview[]): ConversionReview[] {
    const matched = collections.filter(items, (candidate: ConversionReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findConversionReviews(store: ConversionReviewStore, query: ConversionReviewQuery): ConversionReview[] {
  return query.apply(store.list());
}
