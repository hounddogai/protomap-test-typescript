import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientDoubleOptInReview } from "./lenient-double-opt-in-review.js";

/** Keeps lenient double opt in reviews by code. */
export interface LenientDoubleOptInReviewStore {
  find(code: string): LenientDoubleOptInReview | undefined;
  save(item: LenientDoubleOptInReview): void;
  remove(code: string): boolean;
  list(): LenientDoubleOptInReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientDoubleOptInReviewStore implements LenientDoubleOptInReviewStore {
  items: Map<string, LenientDoubleOptInReview>;
  order: string[];

  constructor(items: Map<string, LenientDoubleOptInReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientDoubleOptInReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientDoubleOptInReview): void {
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

  list(): LenientDoubleOptInReview[] {
    const out: LenientDoubleOptInReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientDoubleOptInReviewStore(): LenientDoubleOptInReviewStore {
  return new MemoryLenientDoubleOptInReviewStore(new Map<string, LenientDoubleOptInReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientDoubleOptInReviewStore implements LenientDoubleOptInReviewStore {
  inner: LenientDoubleOptInReviewStore;
  cache: cache.TtlCache<LenientDoubleOptInReview>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientDoubleOptInReviewStore,
    cacheValue: cache.TtlCache<LenientDoubleOptInReview>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientDoubleOptInReview | undefined {
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

  save(item: LenientDoubleOptInReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientDoubleOptInReview[] {
    return this.inner.list();
  }
}

export function newCachedLenientDoubleOptInReviewStore(inner: LenientDoubleOptInReviewStore, ttl: number, clockValue: clock.Clock): LenientDoubleOptInReviewStore {
  return new CachedLenientDoubleOptInReviewStore(
    inner,
    cache.newTtlCache<LenientDoubleOptInReview>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient double opt in reviews. Empty fields match all. */
export class LenientDoubleOptInReviewQuery {
  name: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minGraceDays: number, statuses: string[], limit: number) {
    this.name = name;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientDoubleOptInReview): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientDoubleOptInReview[]): LenientDoubleOptInReview[] {
    const matched = collections.filter(items, (candidate: LenientDoubleOptInReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientDoubleOptInReviews(store: LenientDoubleOptInReviewStore, query: LenientDoubleOptInReviewQuery): LenientDoubleOptInReview[] {
  return query.apply(store.list());
}
