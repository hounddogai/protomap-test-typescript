import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PostReview } from "./post-review.js";

/** Keeps post reviews by code. */
export interface PostReviewStore {
  find(code: string): PostReview | undefined;
  save(item: PostReview): void;
  remove(code: string): boolean;
  list(): PostReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPostReviewStore implements PostReviewStore {
  items: Map<string, PostReview>;
  order: string[];

  constructor(items: Map<string, PostReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PostReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PostReview): void {
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

  list(): PostReview[] {
    const out: PostReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPostReviewStore(): PostReviewStore {
  return new MemoryPostReviewStore(new Map<string, PostReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPostReviewStore implements PostReviewStore {
  inner: PostReviewStore;
  cache: cache.TtlCache<PostReview>;
  hits: number;
  misses: number;

  constructor(inner: PostReviewStore, cacheValue: cache.TtlCache<PostReview>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PostReview | undefined {
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

  save(item: PostReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PostReview[] {
    return this.inner.list();
  }
}

export function newCachedPostReviewStore(inner: PostReviewStore, ttl: number, clockValue: clock.Clock): PostReviewStore {
  return new CachedPostReviewStore(inner, cache.newTtlCache<PostReview>(1024, ttl, clockValue), 0, 0);
}

/** Selects post reviews. Empty fields match all. */
export class PostReviewQuery {
  region: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minGraceDays: number, statuses: string[], limit: number) {
    this.region = region;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PostReview): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PostReview[]): PostReview[] {
    const matched = collections.filter(items, (candidate: PostReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPostReviews(store: PostReviewStore, query: PostReviewQuery): PostReview[] {
  return query.apply(store.list());
}
