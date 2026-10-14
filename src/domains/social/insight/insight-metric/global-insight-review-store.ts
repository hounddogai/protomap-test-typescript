import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalInsightReview } from "./global-insight-review.js";

/** Keeps global insight reviews by code. */
export interface GlobalInsightReviewStore {
  find(code: string): GlobalInsightReview | undefined;
  save(item: GlobalInsightReview): void;
  remove(code: string): boolean;
  list(): GlobalInsightReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalInsightReviewStore implements GlobalInsightReviewStore {
  items: Map<string, GlobalInsightReview>;
  order: string[];

  constructor(items: Map<string, GlobalInsightReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalInsightReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalInsightReview): void {
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

  list(): GlobalInsightReview[] {
    const out: GlobalInsightReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalInsightReviewStore(): GlobalInsightReviewStore {
  return new MemoryGlobalInsightReviewStore(new Map<string, GlobalInsightReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalInsightReviewStore implements GlobalInsightReviewStore {
  inner: GlobalInsightReviewStore;
  cache: cache.TtlCache<GlobalInsightReview>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalInsightReviewStore,
    cacheValue: cache.TtlCache<GlobalInsightReview>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalInsightReview | undefined {
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

  save(item: GlobalInsightReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalInsightReview[] {
    return this.inner.list();
  }
}

export function newCachedGlobalInsightReviewStore(inner: GlobalInsightReviewStore, ttl: number, clockValue: clock.Clock): GlobalInsightReviewStore {
  return new CachedGlobalInsightReviewStore(inner, cache.newTtlCache<GlobalInsightReview>(128, ttl, clockValue), 0, 0);
}

/** Selects global insight reviews. Empty fields match all. */
export class GlobalInsightReviewQuery {
  region: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minScore: number, statuses: string[], limit: number) {
    this.region = region;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalInsightReview): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalInsightReview[]): GlobalInsightReview[] {
    const matched = collections.filter(items, (candidate: GlobalInsightReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalInsightReviews(store: GlobalInsightReviewStore, query: GlobalInsightReviewQuery): GlobalInsightReview[] {
  return query.apply(store.list());
}
