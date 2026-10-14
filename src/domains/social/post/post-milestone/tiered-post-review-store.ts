import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredPostReview } from "./tiered-post-review.js";

/** Keeps tiered post reviews by code. */
export interface TieredPostReviewStore {
  find(code: string): TieredPostReview | undefined;
  save(item: TieredPostReview): void;
  remove(code: string): boolean;
  list(): TieredPostReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredPostReviewStore implements TieredPostReviewStore {
  items: Map<string, TieredPostReview>;
  order: string[];

  constructor(items: Map<string, TieredPostReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredPostReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredPostReview): void {
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

  list(): TieredPostReview[] {
    const out: TieredPostReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredPostReviewStore(): TieredPostReviewStore {
  return new MemoryTieredPostReviewStore(new Map<string, TieredPostReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredPostReviewStore implements TieredPostReviewStore {
  inner: TieredPostReviewStore;
  cache: cache.TtlCache<TieredPostReview>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredPostReviewStore,
    cacheValue: cache.TtlCache<TieredPostReview>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredPostReview | undefined {
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

  save(item: TieredPostReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredPostReview[] {
    return this.inner.list();
  }
}

export function newCachedTieredPostReviewStore(inner: TieredPostReviewStore, ttl: number, clockValue: clock.Clock): TieredPostReviewStore {
  return new CachedTieredPostReviewStore(inner, cache.newTtlCache<TieredPostReview>(64, ttl, clockValue), 0, 0);
}

/** Selects tiered post reviews. Empty fields match all. */
export class TieredPostReviewQuery {
  locale: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minVersion: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredPostReview): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredPostReview[]): TieredPostReview[] {
    const matched = collections.filter(items, (candidate: TieredPostReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredPostReviews(store: TieredPostReviewStore, query: TieredPostReviewQuery): TieredPostReview[] {
  return query.apply(store.list());
}
