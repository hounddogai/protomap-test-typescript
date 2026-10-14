import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedStreakReview } from "./capped-streak-review.js";

/** Keeps capped streak reviews by code. */
export interface CappedStreakReviewStore {
  find(code: string): CappedStreakReview | undefined;
  save(item: CappedStreakReview): void;
  remove(code: string): boolean;
  list(): CappedStreakReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedStreakReviewStore implements CappedStreakReviewStore {
  items: Map<string, CappedStreakReview>;
  order: string[];

  constructor(items: Map<string, CappedStreakReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedStreakReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedStreakReview): void {
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

  list(): CappedStreakReview[] {
    const out: CappedStreakReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedStreakReviewStore(): CappedStreakReviewStore {
  return new MemoryCappedStreakReviewStore(new Map<string, CappedStreakReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedStreakReviewStore implements CappedStreakReviewStore {
  inner: CappedStreakReviewStore;
  cache: cache.TtlCache<CappedStreakReview>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedStreakReviewStore,
    cacheValue: cache.TtlCache<CappedStreakReview>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedStreakReview | undefined {
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

  save(item: CappedStreakReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedStreakReview[] {
    return this.inner.list();
  }
}

export function newCachedCappedStreakReviewStore(inner: CappedStreakReviewStore, ttl: number, clockValue: clock.Clock): CappedStreakReviewStore {
  return new CachedCappedStreakReviewStore(inner, cache.newTtlCache<CappedStreakReview>(128, ttl, clockValue), 0, 0);
}

/** Selects capped streak reviews. Empty fields match all. */
export class CappedStreakReviewQuery {
  label: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minGraceDays: number, statuses: string[], limit: number) {
    this.label = label;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedStreakReview): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedStreakReview[]): CappedStreakReview[] {
    const matched = collections.filter(items, (candidate: CappedStreakReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedStreakReviews(store: CappedStreakReviewStore, query: CappedStreakReviewQuery): CappedStreakReview[] {
  return query.apply(store.list());
}
