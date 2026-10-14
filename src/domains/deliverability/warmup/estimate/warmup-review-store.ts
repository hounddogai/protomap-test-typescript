import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WarmupReview } from "./warmup-review.js";

/** Keeps warmup reviews by code. */
export interface WarmupReviewStore {
  find(code: string): WarmupReview | undefined;
  save(item: WarmupReview): void;
  remove(code: string): boolean;
  list(): WarmupReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWarmupReviewStore implements WarmupReviewStore {
  items: Map<string, WarmupReview>;
  order: string[];

  constructor(items: Map<string, WarmupReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WarmupReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WarmupReview): void {
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

  list(): WarmupReview[] {
    const out: WarmupReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWarmupReviewStore(): WarmupReviewStore {
  return new MemoryWarmupReviewStore(new Map<string, WarmupReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWarmupReviewStore implements WarmupReviewStore {
  inner: WarmupReviewStore;
  cache: cache.TtlCache<WarmupReview>;
  hits: number;
  misses: number;

  constructor(inner: WarmupReviewStore, cacheValue: cache.TtlCache<WarmupReview>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WarmupReview | undefined {
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

  save(item: WarmupReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WarmupReview[] {
    return this.inner.list();
  }
}

export function newCachedWarmupReviewStore(inner: WarmupReviewStore, ttl: number, clockValue: clock.Clock): WarmupReviewStore {
  return new CachedWarmupReviewStore(inner, cache.newTtlCache<WarmupReview>(1024, ttl, clockValue), 0, 0);
}

/** Selects warmup reviews. Empty fields match all. */
export class WarmupReviewQuery {
  title: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WarmupReview): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WarmupReview[]): WarmupReview[] {
    const matched = collections.filter(items, (candidate: WarmupReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWarmupReviews(store: WarmupReviewStore, query: WarmupReviewQuery): WarmupReview[] {
  return query.apply(store.list());
}
