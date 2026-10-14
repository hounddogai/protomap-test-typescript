import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { InsightReview } from "./insight-review.js";

/** Keeps insight reviews by code. */
export interface InsightReviewStore {
  find(code: string): InsightReview | undefined;
  save(item: InsightReview): void;
  remove(code: string): boolean;
  list(): InsightReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryInsightReviewStore implements InsightReviewStore {
  items: Map<string, InsightReview>;
  order: string[];

  constructor(items: Map<string, InsightReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): InsightReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: InsightReview): void {
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

  list(): InsightReview[] {
    const out: InsightReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryInsightReviewStore(): InsightReviewStore {
  return new MemoryInsightReviewStore(new Map<string, InsightReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedInsightReviewStore implements InsightReviewStore {
  inner: InsightReviewStore;
  cache: cache.TtlCache<InsightReview>;
  hits: number;
  misses: number;

  constructor(inner: InsightReviewStore, cacheValue: cache.TtlCache<InsightReview>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): InsightReview | undefined {
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

  save(item: InsightReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): InsightReview[] {
    return this.inner.list();
  }
}

export function newCachedInsightReviewStore(inner: InsightReviewStore, ttl: number, clockValue: clock.Clock): InsightReviewStore {
  return new CachedInsightReviewStore(inner, cache.newTtlCache<InsightReview>(128, ttl, clockValue), 0, 0);
}

/** Selects insight reviews. Empty fields match all. */
export class InsightReviewQuery {
  source: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minBudget: number, statuses: string[], limit: number) {
    this.source = source;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: InsightReview): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: InsightReview[]): InsightReview[] {
    const matched = collections.filter(items, (candidate: InsightReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findInsightReviews(store: InsightReviewStore, query: InsightReviewQuery): InsightReview[] {
  return query.apply(store.list());
}
