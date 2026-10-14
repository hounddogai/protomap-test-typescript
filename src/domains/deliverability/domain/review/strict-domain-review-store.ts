import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictDomainReview } from "./strict-domain-review.js";

/** Keeps strict domain reviews by code. */
export interface StrictDomainReviewStore {
  find(code: string): StrictDomainReview | undefined;
  save(item: StrictDomainReview): void;
  remove(code: string): boolean;
  list(): StrictDomainReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictDomainReviewStore implements StrictDomainReviewStore {
  items: Map<string, StrictDomainReview>;
  order: string[];

  constructor(items: Map<string, StrictDomainReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictDomainReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictDomainReview): void {
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

  list(): StrictDomainReview[] {
    const out: StrictDomainReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictDomainReviewStore(): StrictDomainReviewStore {
  return new MemoryStrictDomainReviewStore(new Map<string, StrictDomainReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictDomainReviewStore implements StrictDomainReviewStore {
  inner: StrictDomainReviewStore;
  cache: cache.TtlCache<StrictDomainReview>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictDomainReviewStore,
    cacheValue: cache.TtlCache<StrictDomainReview>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictDomainReview | undefined {
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

  save(item: StrictDomainReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictDomainReview[] {
    return this.inner.list();
  }
}

export function newCachedStrictDomainReviewStore(inner: StrictDomainReviewStore, ttl: number, clockValue: clock.Clock): StrictDomainReviewStore {
  return new CachedStrictDomainReviewStore(inner, cache.newTtlCache<StrictDomainReview>(256, ttl, clockValue), 0, 0);
}

/** Selects strict domain reviews. Empty fields match all. */
export class StrictDomainReviewQuery {
  title: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minEndsAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictDomainReview): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictDomainReview[]): StrictDomainReview[] {
    const matched = collections.filter(items, (candidate: StrictDomainReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictDomainReviews(store: StrictDomainReviewStore, query: StrictDomainReviewQuery): StrictDomainReview[] {
  return query.apply(store.list());
}
