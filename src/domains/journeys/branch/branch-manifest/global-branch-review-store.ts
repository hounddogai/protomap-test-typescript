import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalBranchReview } from "./global-branch-review.js";

/** Keeps global branch reviews by code. */
export interface GlobalBranchReviewStore {
  find(code: string): GlobalBranchReview | undefined;
  save(item: GlobalBranchReview): void;
  remove(code: string): boolean;
  list(): GlobalBranchReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalBranchReviewStore implements GlobalBranchReviewStore {
  items: Map<string, GlobalBranchReview>;
  order: string[];

  constructor(items: Map<string, GlobalBranchReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalBranchReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalBranchReview): void {
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

  list(): GlobalBranchReview[] {
    const out: GlobalBranchReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalBranchReviewStore(): GlobalBranchReviewStore {
  return new MemoryGlobalBranchReviewStore(new Map<string, GlobalBranchReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalBranchReviewStore implements GlobalBranchReviewStore {
  inner: GlobalBranchReviewStore;
  cache: cache.TtlCache<GlobalBranchReview>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalBranchReviewStore,
    cacheValue: cache.TtlCache<GlobalBranchReview>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalBranchReview | undefined {
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

  save(item: GlobalBranchReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalBranchReview[] {
    return this.inner.list();
  }
}

export function newCachedGlobalBranchReviewStore(inner: GlobalBranchReviewStore, ttl: number, clockValue: clock.Clock): GlobalBranchReviewStore {
  return new CachedGlobalBranchReviewStore(inner, cache.newTtlCache<GlobalBranchReview>(256, ttl, clockValue), 0, 0);
}

/** Selects global branch reviews. Empty fields match all. */
export class GlobalBranchReviewQuery {
  locale: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalBranchReview): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalBranchReview[]): GlobalBranchReview[] {
    const matched = collections.filter(items, (candidate: GlobalBranchReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalBranchReviews(store: GlobalBranchReviewStore, query: GlobalBranchReviewQuery): GlobalBranchReview[] {
  return query.apply(store.list());
}
