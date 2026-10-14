import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TicketViewReview } from "./ticket-view-review.js";

/** Keeps ticket view reviews by code. */
export interface TicketViewReviewStore {
  find(code: string): TicketViewReview | undefined;
  save(item: TicketViewReview): void;
  remove(code: string): boolean;
  list(): TicketViewReview[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTicketViewReviewStore implements TicketViewReviewStore {
  items: Map<string, TicketViewReview>;
  order: string[];

  constructor(items: Map<string, TicketViewReview>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TicketViewReview | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TicketViewReview): void {
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

  list(): TicketViewReview[] {
    const out: TicketViewReview[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTicketViewReviewStore(): TicketViewReviewStore {
  return new MemoryTicketViewReviewStore(new Map<string, TicketViewReview>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTicketViewReviewStore implements TicketViewReviewStore {
  inner: TicketViewReviewStore;
  cache: cache.TtlCache<TicketViewReview>;
  hits: number;
  misses: number;

  constructor(
    inner: TicketViewReviewStore,
    cacheValue: cache.TtlCache<TicketViewReview>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TicketViewReview | undefined {
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

  save(item: TicketViewReview): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TicketViewReview[] {
    return this.inner.list();
  }
}

export function newCachedTicketViewReviewStore(inner: TicketViewReviewStore, ttl: number, clockValue: clock.Clock): TicketViewReviewStore {
  return new CachedTicketViewReviewStore(inner, cache.newTtlCache<TicketViewReview>(512, ttl, clockValue), 0, 0);
}

/** Selects ticket view reviews. Empty fields match all. */
export class TicketViewReviewQuery {
  title: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minMargin: number, statuses: string[], limit: number) {
    this.title = title;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TicketViewReview): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TicketViewReview[]): TicketViewReview[] {
    const matched = collections.filter(items, (candidate: TicketViewReview): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTicketViewReviews(store: TicketViewReviewStore, query: TicketViewReviewQuery): TicketViewReview[] {
  return query.apply(store.list());
}
