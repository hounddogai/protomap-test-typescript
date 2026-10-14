import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BadgeReview } from "./badge-review.js";

/** Keeps badge reviews by code. */
export interface BadgeReviewStore {
  find(code: string): BadgeReview | undefined;
  save(item: BadgeReview): void;
  remove(code: string): boolean;
  list(): BadgeReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBadgeReviewStore implements BadgeReviewStore {
  items: Map<string, BadgeReview>;
  order: string[];

  constructor(items: Map<string, BadgeReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BadgeReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BadgeReview): void {
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

  list(): BadgeReview[] {
    const out: BadgeReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBadgeReviewStore(): BadgeReviewStore {
  return new MemoryBadgeReviewStore(new Map<string, BadgeReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBadgeReviewStore implements BadgeReviewStore {
  inner: BadgeReviewStore;
  cache: cache.TtlCache<BadgeReview>;
  hits: number;
  misses: number;

  constructor(inner: BadgeReviewStore, cacheValue: cache.TtlCache<BadgeReview>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BadgeReview | undefined {
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

  save(item: BadgeReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BadgeReview[] {
    return this.inner.list();
  }
}

export function newCachedBadgeReviewStore(inner: BadgeReviewStore, ttl: number, clockValue: clock.Clock): BadgeReviewStore {
  return new CachedBadgeReviewStore(inner, cache.newTtlCache<BadgeReview>(64, ttl, clockValue), 0, 0);
}

/** Selects badge reviews. Empty fields match all. */
export class BadgeReviewQuery {
  name: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minSequence: number, statuses: string[], limit: number) {
    this.name = name;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BadgeReview): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BadgeReview[]): BadgeReview[] {
    const matched = collections.filter(items, (candidate: BadgeReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBadgeReviews(store: BadgeReviewStore, query: BadgeReviewQuery): BadgeReview[] {
  return query.apply(store.list());
}
