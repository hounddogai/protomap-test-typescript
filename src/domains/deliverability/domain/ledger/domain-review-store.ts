import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DomainReview } from "./domain-review.js";

/** Keeps domain reviews by code. */
export interface DomainReviewStore {
  find(code: string): DomainReview | undefined;
  save(item: DomainReview): void;
  remove(code: string): boolean;
  list(): DomainReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDomainReviewStore implements DomainReviewStore {
  items: Map<string, DomainReview>;
  order: string[];

  constructor(items: Map<string, DomainReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DomainReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DomainReview): void {
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

  list(): DomainReview[] {
    const out: DomainReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDomainReviewStore(): DomainReviewStore {
  return new MemoryDomainReviewStore(new Map<string, DomainReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDomainReviewStore implements DomainReviewStore {
  inner: DomainReviewStore;
  cache: cache.TtlCache<DomainReview>;
  hits: number;
  misses: number;

  constructor(inner: DomainReviewStore, cacheValue: cache.TtlCache<DomainReview>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DomainReview | undefined {
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

  save(item: DomainReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DomainReview[] {
    return this.inner.list();
  }
}

export function newCachedDomainReviewStore(inner: DomainReviewStore, ttl: number, clockValue: clock.Clock): DomainReviewStore {
  return new CachedDomainReviewStore(inner, cache.newTtlCache<DomainReview>(512, ttl, clockValue), 0, 0);
}

/** Selects domain reviews. Empty fields match all. */
export class DomainReviewQuery {
  locale: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minAmount: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DomainReview): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DomainReview[]): DomainReview[] {
    const matched = collections.filter(items, (candidate: DomainReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDomainReviews(store: DomainReviewStore, query: DomainReviewQuery): DomainReview[] {
  return query.apply(store.list());
}
