import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyPostReview } from "./legacy-post-review.js";

/** Keeps legacy post reviews by code. */
export interface LegacyPostReviewStore {
  find(code: string): LegacyPostReview | undefined;
  save(item: LegacyPostReview): void;
  remove(code: string): boolean;
  list(): LegacyPostReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyPostReviewStore implements LegacyPostReviewStore {
  items: Map<string, LegacyPostReview>;
  order: string[];

  constructor(items: Map<string, LegacyPostReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyPostReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyPostReview): void {
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

  list(): LegacyPostReview[] {
    const out: LegacyPostReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyPostReviewStore(): LegacyPostReviewStore {
  return new MemoryLegacyPostReviewStore(new Map<string, LegacyPostReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyPostReviewStore implements LegacyPostReviewStore {
  inner: LegacyPostReviewStore;
  cache: cache.TtlCache<LegacyPostReview>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyPostReviewStore,
    cacheValue: cache.TtlCache<LegacyPostReview>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyPostReview | undefined {
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

  save(item: LegacyPostReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyPostReview[] {
    return this.inner.list();
  }
}

export function newCachedLegacyPostReviewStore(inner: LegacyPostReviewStore, ttl: number, clockValue: clock.Clock): LegacyPostReviewStore {
  return new CachedLegacyPostReviewStore(inner, cache.newTtlCache<LegacyPostReview>(128, ttl, clockValue), 0, 0);
}

/** Selects legacy post reviews. Empty fields match all. */
export class LegacyPostReviewQuery {
  title: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minRate: number, statuses: string[], limit: number) {
    this.title = title;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyPostReview): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyPostReview[]): LegacyPostReview[] {
    const matched = collections.filter(items, (candidate: LegacyPostReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyPostReviews(store: LegacyPostReviewStore, query: LegacyPostReviewQuery): LegacyPostReview[] {
  return query.apply(store.list());
}
