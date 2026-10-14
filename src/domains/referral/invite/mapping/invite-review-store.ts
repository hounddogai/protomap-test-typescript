import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { InviteReview } from "./invite-review.js";

/** Keeps invite reviews by code. */
export interface InviteReviewStore {
  find(code: string): InviteReview | undefined;
  save(item: InviteReview): void;
  remove(code: string): boolean;
  list(): InviteReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryInviteReviewStore implements InviteReviewStore {
  items: Map<string, InviteReview>;
  order: string[];

  constructor(items: Map<string, InviteReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): InviteReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: InviteReview): void {
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

  list(): InviteReview[] {
    const out: InviteReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryInviteReviewStore(): InviteReviewStore {
  return new MemoryInviteReviewStore(new Map<string, InviteReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedInviteReviewStore implements InviteReviewStore {
  inner: InviteReviewStore;
  cache: cache.TtlCache<InviteReview>;
  hits: number;
  misses: number;

  constructor(inner: InviteReviewStore, cacheValue: cache.TtlCache<InviteReview>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): InviteReview | undefined {
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

  save(item: InviteReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): InviteReview[] {
    return this.inner.list();
  }
}

export function newCachedInviteReviewStore(inner: InviteReviewStore, ttl: number, clockValue: clock.Clock): InviteReviewStore {
  return new CachedInviteReviewStore(inner, cache.newTtlCache<InviteReview>(1024, ttl, clockValue), 0, 0);
}

/** Selects invite reviews. Empty fields match all. */
export class InviteReviewQuery {
  title: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minLimit: number, statuses: string[], limit: number) {
    this.title = title;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: InviteReview): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: InviteReview[]): InviteReview[] {
    const matched = collections.filter(items, (candidate: InviteReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findInviteReviews(store: InviteReviewStore, query: InviteReviewQuery): InviteReview[] {
  return query.apply(store.list());
}
