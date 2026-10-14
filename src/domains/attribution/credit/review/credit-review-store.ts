import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CreditReview } from "./credit-review.js";

/** Keeps credit reviews by code. */
export interface CreditReviewStore {
  find(code: string): CreditReview | undefined;
  save(item: CreditReview): void;
  remove(code: string): boolean;
  list(): CreditReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCreditReviewStore implements CreditReviewStore {
  items: Map<string, CreditReview>;
  order: string[];

  constructor(items: Map<string, CreditReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CreditReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CreditReview): void {
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

  list(): CreditReview[] {
    const out: CreditReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCreditReviewStore(): CreditReviewStore {
  return new MemoryCreditReviewStore(new Map<string, CreditReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCreditReviewStore implements CreditReviewStore {
  inner: CreditReviewStore;
  cache: cache.TtlCache<CreditReview>;
  hits: number;
  misses: number;

  constructor(inner: CreditReviewStore, cacheValue: cache.TtlCache<CreditReview>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CreditReview | undefined {
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

  save(item: CreditReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CreditReview[] {
    return this.inner.list();
  }
}

export function newCachedCreditReviewStore(inner: CreditReviewStore, ttl: number, clockValue: clock.Clock): CreditReviewStore {
  return new CachedCreditReviewStore(inner, cache.newTtlCache<CreditReview>(64, ttl, clockValue), 0, 0);
}

/** Selects credit reviews. Empty fields match all. */
export class CreditReviewQuery {
  label: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minQuantity: number, statuses: string[], limit: number) {
    this.label = label;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CreditReview): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CreditReview[]): CreditReview[] {
    const matched = collections.filter(items, (candidate: CreditReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCreditReviews(store: CreditReviewStore, query: CreditReviewQuery): CreditReview[] {
  return query.apply(store.list());
}
