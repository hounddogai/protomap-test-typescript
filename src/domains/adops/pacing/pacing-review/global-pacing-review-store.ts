import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalPacingReview } from "./global-pacing-review.js";

/** Keeps global pacing reviews by code. */
export interface GlobalPacingReviewStore {
  find(code: string): GlobalPacingReview | undefined;
  save(item: GlobalPacingReview): void;
  remove(code: string): boolean;
  list(): GlobalPacingReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalPacingReviewStore implements GlobalPacingReviewStore {
  items: Map<string, GlobalPacingReview>;
  order: string[];

  constructor(items: Map<string, GlobalPacingReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalPacingReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalPacingReview): void {
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

  list(): GlobalPacingReview[] {
    const out: GlobalPacingReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalPacingReviewStore(): GlobalPacingReviewStore {
  return new MemoryGlobalPacingReviewStore(new Map<string, GlobalPacingReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalPacingReviewStore implements GlobalPacingReviewStore {
  inner: GlobalPacingReviewStore;
  cache: cache.TtlCache<GlobalPacingReview>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalPacingReviewStore,
    cacheValue: cache.TtlCache<GlobalPacingReview>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalPacingReview | undefined {
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

  save(item: GlobalPacingReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalPacingReview[] {
    return this.inner.list();
  }
}

export function newCachedGlobalPacingReviewStore(inner: GlobalPacingReviewStore, ttl: number, clockValue: clock.Clock): GlobalPacingReviewStore {
  return new CachedGlobalPacingReviewStore(inner, cache.newTtlCache<GlobalPacingReview>(1024, ttl, clockValue), 0, 0);
}

/** Selects global pacing reviews. Empty fields match all. */
export class GlobalPacingReviewQuery {
  title: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minRatio: number, statuses: string[], limit: number) {
    this.title = title;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalPacingReview): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalPacingReview[]): GlobalPacingReview[] {
    const matched = collections.filter(items, (candidate: GlobalPacingReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalPacingReviews(store: GlobalPacingReviewStore, query: GlobalPacingReviewQuery): GlobalPacingReview[] {
  return query.apply(store.list());
}
