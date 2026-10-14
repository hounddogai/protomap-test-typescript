import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RedemptionReview } from "./redemption-review.js";

/** Keeps redemption reviews by code. */
export interface RedemptionReviewStore {
  find(code: string): RedemptionReview | undefined;
  save(item: RedemptionReview): void;
  remove(code: string): boolean;
  list(): RedemptionReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRedemptionReviewStore implements RedemptionReviewStore {
  items: Map<string, RedemptionReview>;
  order: string[];

  constructor(items: Map<string, RedemptionReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RedemptionReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RedemptionReview): void {
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

  list(): RedemptionReview[] {
    const out: RedemptionReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRedemptionReviewStore(): RedemptionReviewStore {
  return new MemoryRedemptionReviewStore(new Map<string, RedemptionReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRedemptionReviewStore implements RedemptionReviewStore {
  inner: RedemptionReviewStore;
  cache: cache.TtlCache<RedemptionReview>;
  hits: number;
  misses: number;

  constructor(
    inner: RedemptionReviewStore,
    cacheValue: cache.TtlCache<RedemptionReview>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RedemptionReview | undefined {
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

  save(item: RedemptionReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RedemptionReview[] {
    return this.inner.list();
  }
}

export function newCachedRedemptionReviewStore(inner: RedemptionReviewStore, ttl: number, clockValue: clock.Clock): RedemptionReviewStore {
  return new CachedRedemptionReviewStore(inner, cache.newTtlCache<RedemptionReview>(256, ttl, clockValue), 0, 0);
}

/** Selects redemption reviews. Empty fields match all. */
export class RedemptionReviewQuery {
  title: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minStartsAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RedemptionReview): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RedemptionReview[]): RedemptionReview[] {
    const matched = collections.filter(items, (candidate: RedemptionReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRedemptionReviews(store: RedemptionReviewStore, query: RedemptionReviewQuery): RedemptionReview[] {
  return query.apply(store.list());
}
